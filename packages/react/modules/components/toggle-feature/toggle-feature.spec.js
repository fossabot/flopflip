import React from 'react';
import { shallow } from 'enzyme';
import ToggleFeature from './toggle-feature';

const UntoggledComponent = () => (
  <React.Fragment>UntoggledComponent</React.Fragment>
);
UntoggledComponent.displayName = 'UntoggledComponent';
const ToggledComponent = () => (
  <React.Fragment>ToggledComponent</React.Fragment>
);
ToggledComponent.displayName = 'ToggledComponent';
const FeatureComponent = () => (
  <React.Fragment>FeatureComponent</React.Fragment>
);
FeatureComponent.displayName = 'FeatureComponent';

describe('when feature disabled', () => {
  describe('with untoggled component', () => {
    let wrapper;

    beforeEach(() => {
      wrapper = shallow(
        <ToggleFeature
          isFeatureEnabled={false}
          untoggledComponent={UntoggledComponent}
        >
          <FeatureComponent />
        </ToggleFeature>
      );
    });

    it('should match snapshot', () => {
      expect(wrapper).toMatchSnapshot();
    });

    it('should render the `UntoggledComponent`', () => {
      expect(wrapper).toRender(UntoggledComponent);
    });

    it('should not render the `FeatureComponent`', () => {
      expect(wrapper).not.toRender(FeatureComponent);
    });
  });

  describe('without untoggled component', () => {
    let wrapper;

    beforeEach(() => {
      wrapper = shallow(
        <ToggleFeature isFeatureEnabled={false}>
          <FeatureComponent />
        </ToggleFeature>
      );
    });

    it('should match snapshot', () => {
      expect(wrapper).toMatchSnapshot();
    });

    it('should not render the `FeatureComponent`', () => {
      expect(wrapper).not.toRender(FeatureComponent);
    });
  });
});

describe('when feature enabled', () => {
  let wrapper;

  describe('with `children`', () => {
    describe('being a `node`', () => {
      beforeEach(() => {
        wrapper = shallow(
          <ToggleFeature
            isFeatureEnabled
            untoggledComponent={UntoggledComponent}
          >
            <FeatureComponent />
          </ToggleFeature>
        );
      });

      it('should match snapshot', () => {
        expect(wrapper).toMatchSnapshot();
      });

      it('should not render the `UntoggledComponent`', () => {
        expect(wrapper).not.toRender(UntoggledComponent);
      });

      it('should render the `FeatureComponent`', () => {
        expect(wrapper).toRender(FeatureComponent);
      });
    });

    describe('being a `function`', () => {
      let props;
      beforeEach(() => {
        props = {
          isFeatureEnabled: true,
          untoggledComponent: UntoggledComponent,
          children: jest.fn(() => <div>FeatureComponent</div>),
        };

        wrapper = shallow(<ToggleFeature {...props} />);
      });

      it('should match snapshot', () => {
        expect(wrapper).toMatchSnapshot();
      });

      it('should invoke `children`', () => {
        expect(props.children).toHaveBeenCalled();
      });

      it('should invoke `children` with `isFeatureEnabled`', () => {
        expect(props.children).toHaveBeenCalledWith({
          isFeatureEnabled: props.isFeatureEnabled,
        });
      });
    });
  });

  describe('with `toggledComponent`', () => {
    beforeEach(() => {
      wrapper = shallow(
        <ToggleFeature
          isFeatureEnabled
          untoggledComponent={UntoggledComponent}
          toggledComponent={FeatureComponent}
        />
      );
    });

    it('should match snapshot', () => {
      expect(wrapper).toMatchSnapshot();
    });

    it('should not render the `UntoggledComponent`', () => {
      expect(wrapper).not.toRender(UntoggledComponent);
    });

    it('should render the `FeatureComponent`', () => {
      expect(wrapper).toRender(FeatureComponent);
    });
  });

  describe('with `render`', () => {
    let props;
    beforeEach(() => {
      props = {
        isFeatureEnabled: true,
        untoggledComponent: UntoggledComponent,
        render: jest.fn(() => <div>FeatureComponent</div>),
      };

      wrapper = shallow(<ToggleFeature {...props} />);
    });

    it('should match snapshot', () => {
      expect(wrapper).toMatchSnapshot();
    });

    it('should invoke `render`', () => {
      expect(props.render).toHaveBeenCalled();
    });
  });
});

describe('statics', () => {
  it('should have a `diplayName`', () => {
    expect(ToggleFeature.displayName).toEqual('ToggleFeature');
  });
});
