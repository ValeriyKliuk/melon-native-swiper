'use strict';
Object.defineProperty(exports, '__esModule', {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _reactNative = require('react-native');

var _reactNative2 = _interopRequireDefault(_reactNative);

var _reactTimerMixin = require('react-timer-mixin');

var _reactTimerMixin2 = _interopRequireDefault(_reactTimerMixin);

var _indexStyle = require('./index.style');

var _indexStyle2 = _interopRequireDefault(_indexStyle);

var _Dimensions$get = _reactNative.Dimensions.get('window');

var width = _Dimensions$get.width;
var height = _Dimensions$get.height;

function defaultRenderDot(index, isActive) {
  return _reactNative2['default'].createElement(_reactNative.View, { key: index, style: isActive ? _indexStyle2['default'].activeDot : _indexStyle2['default'].dot });
}

exports['default'] = _reactNative2['default'].createClass({
  displayName: 'index',

  /**
   * Props Validation
   * @type {Object}
   */
  propTypes: {
    horizontal: _reactNative2['default'].PropTypes.bool,
    children: _reactNative2['default'].PropTypes.node.isRequired,
    style: _reactNative.View.propTypes.style,
    pagingEnabled: _reactNative2['default'].PropTypes.bool,
    showsHorizontalScrollIndicator: _reactNative2['default'].PropTypes.bool,
    showsVerticalScrollIndicator: _reactNative2['default'].PropTypes.bool,
    bounces: _reactNative2['default'].PropTypes.bool,
    scrollsToTop: _reactNative2['default'].PropTypes.bool,
    removeClippedSubviews: _reactNative2['default'].PropTypes.bool,
    automaticallyAdjustContentInsets: _reactNative2['default'].PropTypes.bool,
    showsPagination: _reactNative2['default'].PropTypes.bool,
    showsButtons: _reactNative2['default'].PropTypes.bool,
    loop: _reactNative2['default'].PropTypes.bool,
    autoplay: _reactNative2['default'].PropTypes.bool,
    autoplayTimeout: _reactNative2['default'].PropTypes.number,
    autoplayDirection: _reactNative2['default'].PropTypes.bool,
    index: _reactNative2['default'].PropTypes.number,
    renderPagination: _reactNative2['default'].PropTypes.func,
    renderDot: _reactNative2['default'].PropTypes.func
  },

  mixins: [_reactTimerMixin2['default']],

  /**
   * Default props
   * @return {object} props
   * @see http://facebook.github.io/react-native/docs/scrollview.html
   */
  getDefaultProps: function getDefaultProps() {
    return {
      horizontal: true,
      pagingEnabled: true,
      showsHorizontalScrollIndicator: false,
      showsVerticalScrollIndicator: false,
      bounces: false,
      scrollsToTop: false,
      removeClippedSubviews: true,
      automaticallyAdjustContentInsets: false,
      showsPagination: true,
      showsButtons: false,
      loop: true,
      autoplay: false,
      autoplayTimeout: 2.5,
      autoplayDirection: true,
      index: 0,
      renderDot: defaultRenderDot
    };
  },

  /**
   * Init states
   * @return {object} states
   */
  getInitialState: function getInitialState() {
    var props = this.props;

    var initState = {
      isScrolling: false,
      autoplayEnd: false
    };

    initState.total = props.children ? props.children.length || 1 : 0;

    initState.index = initState.total > 1 ? Math.min(props.index, initState.total - 1) : 0;

    // Default: horizontal
    initState.dir = props.horizontal == false ? 'y' : 'x';
    initState.width = props.width || width;
    initState.height = props.height || height;
    initState.offset = {};

    if (initState.total > 1) {
      var setup = props.loop ? 1 : initState.index;
      initState.offset[initState.dir] = initState.dir == 'y' ? initState.height * setup : initState.width * setup;
    }

    return initState;
  },

  /**
   * autoplay timer
   * @type {null}
   */
  autoplayTimer: null,

  componentWillMount: function componentWillMount() {
    this.props = this.injectState(this.props);
  },

  componentDidMount: function componentDidMount() {
    this.autoplay();
  },

  /**
   * Automatic rolling
   */
  autoplay: function autoplay() {
    var _this = this;

    if (!this.props.autoplay || this.state.isScrolling || this.state.autoplayEnd) return;

    clearTimeout(this.autoplayTimer);

    this.autoplayTimer = this.setTimeout(function () {
      if (!_this.props.loop && (_this.props.autoplayDirection ? _this.state.index == _this.state.total - 1 : _this.state.index == 0)) return _this.setState({
        autoplayEnd: true
      });
      _this.scrollTo(_this.props.autoplayDirection ? 1 : -1);
    }, this.props.autoplayTimeout * 1000);
  },

  /**
   * Scroll begin handle
   * @param  {object} e native event
   */
  onScrollBegin: function onScrollBegin(e) {
    var _this2 = this;

    // update scroll state
    this.setState({
      isScrolling: true
    });

    this.setTimeout(function () {
      _this2.props.onScrollBeginDrag && _this2.props.onScrollBeginDrag(e, _this2.state, _this2);
    });
  },

  /**
   * Scroll end handle
   * @param  {object} e native event
   */
  onScrollEnd: function onScrollEnd(e) {
    var _this3 = this;

    // update scroll state
    this.setState({
      isScrolling: false
    });

    this.updateIndex(e.nativeEvent.contentOffset, this.state.dir);

    // Note: `this.setState` is async, so I call the `onMomentumScrollEnd`
    // in setTimeout to ensure synchronous update `index`
    this.setTimeout(function () {
      _this3.autoplay();

      // if `onMomentumScrollEnd` registered will be called here
      _this3.props.onMomentumScrollEnd && _this3.props.onMomentumScrollEnd(e, _this3.state, _this3);
    });
  },

  /**
   * Update index after scroll
   * @param  {object} offset content offset
   * @param  {string} dir    'x' || 'y'
   */
  updateIndex: function updateIndex(offset, dir) {

    var state = this.state;
    var index = state.index;
    var diff = offset[dir] - state.offset[dir];
    var step = dir == 'x' ? state.width : state.height;

    // Do nothing if offset no change.
    if (!diff) return;

    // Note: if touch very very quickly and continuous,
    // the variation of `index` more than 1.
    index = index + diff / step;

    if (this.props.loop) {
      if (index <= -1) {
        index = state.total - 1;
        offset[dir] = step * state.total;
      } else if (index >= state.total) {
        index = 0;
        offset[dir] = step;
      }
    }

    this.setState({
      index: index,
      offset: offset
    });
  },

  /**
   * Scroll by index
   * @param  {number} index offset index
   */
  scrollTo: function scrollTo(index) {
    if (this.state.isScrolling) return;
    var state = this.state;
    var diff = (this.props.loop ? 1 : 0) + index + this.state.index;
    var x = 0;
    var y = 0;
    if (state.dir == 'x') x = diff * state.width;
    if (state.dir == 'y') y = diff * state.height;
    this.refs.scrollView && this.refs.scrollView.scrollTo(y, x);

    // update scroll state
    this.setState({
      isScrolling: true,
      autoplayEnd: false
    });
  },

  /**
   * Render pagination
   * @return {object} react-dom
   */
  renderPagination: function renderPagination() {

    // By default, dots only show when `total` > 2
    if (this.state.total <= 1) return null;

    var dots = [];

    for (var i = 0; i < this.state.total; i++) {
      var isActive = i === this.state.index;
      dots.push(this.props.renderDot(i, isActive));
    }

    return _reactNative2['default'].createElement(
      _reactNative.View,
      { pointerEvents: 'none', style: [_indexStyle2['default']['pagination_' + this.state.dir], this.props.paginationStyle] },
      dots
    );
  },

  renderTitle: function renderTitle() {
    var child = this.props.children[this.state.index];
    var title = child && child.props.title;
    return title ? _reactNative2['default'].createElement(
      _reactNative.View,
      { style: _indexStyle2['default'].title },
      this.props.children[this.state.index].props.title
    ) : null;
  },

  renderNextButton: function renderNextButton() {
    var _this4 = this;

    var button = undefined;

    if (this.props.loop || this.state.index != this.state.total - 1) {
      button = this.props.nextButton || _reactNative2['default'].createElement(
        _reactNative.Text,
        { style: _indexStyle2['default'].buttonText },
        '›'
      );
    }

    return _reactNative2['default'].createElement(
      _reactNative.TouchableOpacity,
      { onPress: function () {
          return button !== null && _this4.scrollTo.call(_this4, 1);
        } },
      _reactNative2['default'].createElement(
        _reactNative.View,
        null,
        button
      )
    );
  },

  renderPrevButton: function renderPrevButton() {
    var _this5 = this;

    var button = null;

    if (this.props.loop || this.state.index != 0) {
      button = this.props.prevButton || _reactNative2['default'].createElement(
        _reactNative.Text,
        { style: _indexStyle2['default'].buttonText },
        '‹'
      );
    }

    return _reactNative2['default'].createElement(
      _reactNative.TouchableOpacity,
      { onPress: function () {
          return button !== null && _this5.scrollTo.call(_this5, -1);
        } },
      _reactNative2['default'].createElement(
        _reactNative.View,
        null,
        button
      )
    );
  },

  renderButtons: function renderButtons(width, height) {
    return _reactNative2['default'].createElement(
      _reactNative.View,
      { pointerEvents: 'box-none', style: [_indexStyle2['default'].buttonWrapper, { width: width, height: height }, this.props.buttonWrapperStyle] },
      this.renderPrevButton(),
      this.renderNextButton()
    );
  },

  /**
   * Inject state to ScrollResponder
   * @param  {object} props origin props
   * @return {object} props injected props
   */
  injectState: function injectState(props) {
    var _this6 = this;

    /*    const scrollResponders = [
          'onMomentumScrollBegin',
          'onTouchStartCapture',
          'onTouchStart',
          'onTouchEnd',
          'onResponderRelease',
        ]*/

    for (var prop in props) {
      // if(~scrollResponders.indexOf(prop)
      if (typeof props[prop] === 'function' && prop !== 'onMomentumScrollEnd' && prop !== 'renderPagination' && prop !== 'onScrollBeginDrag') {
        (function () {
          var originResponder = props[prop];
          props[prop] = function (e) {
            return originResponder(e, _this6.state, _this6);
          };
        })();
      }
    }

    return props;
  },

  /**
   * Default render
   * @return {object} react-dom
   */
  render: function render() {
    var state = this.state;
    var props = this.props;
    var children = props.children;
    var index = state.index;
    var total = state.total;
    var loop = props.loop;
    var dir = state.dir;
    var key = 0;

    var pages = [];
    var pageStyle = [{ width: state.width, height: state.height }, _indexStyle2['default'].slide];

    var containerStyle = {
      width: state.width,
      height: state.height
    };

    // For make infinite at least total > 1
    if (total > 1) {

      // Re-design a loop model for avoid img flickering
      pages = Object.keys(children);
      if (loop) {
        pages.unshift(total - 1);
        pages.push(0);
      }

      pages = pages.map(function (page, i) {
        return _reactNative2['default'].createElement(
          _reactNative.View,
          { style: pageStyle, key: i },
          children[page]
        );
      });
    } else pages = _reactNative2['default'].createElement(
      _reactNative.View,
      { style: pageStyle },
      children
    );

    return _reactNative2['default'].createElement(
      _reactNative.View,
      { style: [_indexStyle2['default'].container, containerStyle] },
      _reactNative2['default'].createElement(
        _reactNative.ScrollView,
        _extends({ ref: 'scrollView'
        }, props, {
          contentContainerStyle: [_indexStyle2['default'].wrapper, props.style],
          contentOffset: state.offset,
          onScrollBeginDrag: this.onScrollBegin,
          onMomentumScrollEnd: this.onScrollEnd }),
        pages
      ),
      props.showsPagination && (props.renderPagination ? this.props.renderPagination(state.index, state.total, this) : this.renderPagination()),
      this.renderTitle(),
      this.props.showsButtons && this.renderButtons(state.width, state.height)
    );
  }
});
module.exports = exports['default'];