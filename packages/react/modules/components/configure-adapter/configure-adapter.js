// @flow

import type { Flags, Adapter, AdapterArgs, User } from '@flopflip/types';

import React, { PureComponent, type Node } from 'react';
import createReactContext, { type Context } from 'create-react-context';
import merge from 'deepmerge';

export const AdapterStates: {
  UNCONFIGURED: string,
  CONFIGURING: string,
  CONFIGURED: string,
} = {
  UNCONFIGURED: 'unconfigured',
  CONFIGURING: 'configuring',
  CONFIGURED: 'configured',
};

type Props = {
  shouldDeferAdapterConfiguration?: boolean,
  adapter: Adapter,
  adapterArgs: AdapterArgs,
  defaultFlags?: Flags,
  children: React.Component<any>,
};
type State = {
  appliedAdapterArgs: AdapterArgs,
};
type AdapterState = $Values<typeof AdapterStates>;
type AdapterReconfigurationOptions = {
  shouldOverwrite?: boolean,
};
type AdapterReconfiguration = {
  adapterArgs: AdapterArgs,
  options: AdapterReconfigurationOptions,
};
type ReconfigureAdapter = (
  adapterArgs: AdapterArgs,
  options: AdapterReconfigurationOptions
) => void;

export const AdapterContext: Context<ReconfigureAdapter> = createReactContext(
  () => {}
);

export const mergeAdapterArgs = (
  previousAdapterArgs: AdapterArgs,
  { adapterArgs: nextAdapterArgs, options = {} }: AdapterReconfiguration
): AdapterArgs =>
  options.shouldOverwrite
    ? nextAdapterArgs
    : merge(previousAdapterArgs, nextAdapterArgs);

export default class ConfigureAdapter extends PureComponent<Props, State> {
  static defaultProps = {
    shouldDeferAdapterConfiguration: false,
    children: null,
    defaultFlags: {},
  };

  adapterState: AdapterState = AdapterStates.UNCONFIGURED;
  pendingAdapterArgs: ?AdapterArgs = null;

  state: { appliedAdapterArgs: AdapterArgs } = {
    appliedAdapterArgs: this.props.adapterArgs,
  };

  setAdapterState = (nextAdapterState: AdapterState): void => {
    this.adapterState = nextAdapterState;
  };
  applyAdapterArgs = (nextAdapterArgs: AdapterArgs): void =>
    this.setState(prevState => ({
      ...prevState,
      appliedAdapterArgs: nextAdapterArgs,
    }));

  /**
   * NOTE:
   *   This is passed through the React context (it's a public API).
   *   Internally this component has a `ReconfigureAdapter` type;
   *   this function has two arguments for clarify.
   */
  reconfigureOrQueue = (
    nextAdapterArgs: AdapterArgs,
    options: AdapterReconfigurationOptions
  ): void =>
    this.adapterState === AdapterStates.CONFIGURED &&
    this.adapterState !== AdapterStates.CONFIGURING
      ? this.applyAdapterArgs(
          mergeAdapterArgs(this.state.appliedAdapterArgs, {
            adapterArgs: nextAdapterArgs,
            options,
          })
        )
      : this.setPendingAdapterArgs({ adapterArgs: nextAdapterArgs, options });

  setPendingAdapterArgs = (
    nextReconfiguration: AdapterReconfiguration
  ): void => {
    /**
     * NOTE:
     *    The next reconfiguration is merged into the previous
     *    one instead of maintaining a queue.
     */
    this.pendingAdapterArgs = mergeAdapterArgs(
      this.pendingAdapterArgs || this.state.appliedAdapterArgs,
      nextReconfiguration
    );
  };
  applyPendingAdapterArgs = (): void => {
    if (this.pendingAdapterArgs) this.applyAdapterArgs(this.pendingAdapterArgs);

    this.pendingAdapterArgs = null;
  };

  handleDefaultFlags = (defaultFlags: Flags): void => {
    if (Object.keys(defaultFlags).length > 0) {
      this.props.adapterArgs.onFlagsStateChange(defaultFlags);
    }
  };

  componentWillReceiveProps(nextProps: Props): void {
    if (nextProps.adapterArgs !== this.props.adapterArgs) {
      /**
       * NOTE:
       *   To keep the component controlled changes to the `props.adapterArgs`
       *   will always overwrite existing `adapterArgs`. Even when changs occured
       *   from `ReconfigureFlopflip`. This aims to reduce confusion. Please open
       *   an issue unless it does not. Maybe `adapterArgs` on this component will
       *   become `defaultAdapterArgs` in the future and changes to them always
       *   have to be carried out through `ReconfigureFlopflip`.
       */
      this.reconfigureOrQueue(nextProps.adapterArgs, { shouldOverwrite: true });
    }
  }

  componentDidMount(): Promise<any> | void {
    this.handleDefaultFlags(this.props.defaultFlags);

    if (!this.props.shouldDeferAdapterConfiguration) {
      this.setAdapterState(AdapterStates.CONFIGURING);

      return this.props.adapter
        .configure(this.state.appliedAdapterArgs)
        .then(() => {
          this.setAdapterState(AdapterStates.CONFIGURED);
          this.applyPendingAdapterArgs();
        });
    }
  }

  componentDidUpdate(): Promise<any> | void {
    /**
     * NOTE:
     *    Be careful here to not double configure from `componentDidMount`.
     */

    if (
      !this.props.shouldDeferAdapterConfiguration &&
      this.adapterState !== AdapterStates.CONFIGURED &&
      this.adapterState !== AdapterStates.CONFIGURING
    ) {
      this.setAdapterState(AdapterStates.CONFIGURING);

      return this.props.adapter
        .configure(this.state.appliedAdapterArgs)
        .then(() => {
          this.setAdapterState(AdapterStates.CONFIGURED);
        });
    } else if (
      this.adapterState === AdapterStates.CONFIGURED &&
      this.adapterState !== AdapterStates.CONFIGURING
    ) {
      this.setAdapterState(AdapterStates.CONFIGURING);

      return this.props.adapter
        .reconfigure(this.state.appliedAdapterArgs)
        .then(() => {
          this.setAdapterState(AdapterStates.CONFIGURED);
          this.applyPendingAdapterArgs();
        });
    }
  }

  render(): Node {
    return (
      <AdapterContext.Provider value={this.reconfigureOrQueue}>
        {this.props.children ? React.Children.only(this.props.children) : null}
      </AdapterContext.Provider>
    );
  }
}
