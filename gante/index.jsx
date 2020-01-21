import { throttle } from 'lodash';
import React, { Component, PropTypes } from 'react';
import Chart from './components/chart.js';
import { getDays, getMonths, getPeriods } from './components/utils';


export default class Gantt extends Component {
  static propTypes = {
    data: PropTypes.arrayOf(PropTypes.shape({
        title: PropTypes.any,
        content: PropTypes.any,
        startDate: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)]),
        endDate: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)]),
        backgroundColor: PropTypes.string,
        color: PropTypes.string,
        onClick: PropTypes.func,
        nodes: PropTypes.arrayOf(PropTypes.shape({
          content: PropTypes.any,
          startDate: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)]),
          endDate: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)]),
          backgroundColor: PropTypes.string,
          color: PropTypes.string,
          onClick: PropTypes.func
        }))
    })),
    bottomLimit: PropTypes.number, // 距离底端多少个数据时触发 onScrollToBottom 方法
    rightLimit: PropTypes.number, // 距离右端多少天时触发 onScrollToRight 方法
    onScrollToBottom: PropTypes.func,
    onScrollToRight: PropTypes.func,
    startDate: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)]),
    endDate: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)])
  };

  static defaultProps = {
    bottomLimit: 0,
    rightLimit: 0,
    data: []
  };

  state = {
    startDate: '',
    endDate: '',
    svgWidth: 0,
    columnNum: 0,
    viewNum: 31,
    columnWidth: 0,
    rowHeight: 45,
    headerHeight: 45,
    position: {
      x: 0, // scrollLeft
      y: 0 // scrollTop
    },
    view: {
      leftPercent: 0,
      widthPercent: 0
    },
    dates: []
  };

  // 获取 svg 宽度及 每一列宽度
  getWidth = () => {
    if (!this.gantt || !this.state.dates.length) return this.setState({ svgWidth: 0, columnWidth: 0 });

    const { viewNum, columnNum } = this.state;
    const num = (viewNum - columnNum) > 0 ? columnNum : viewNum;
    const viewWidth = this.gantt.clientWidth;
    const columnWidth = viewWidth / num;
    const svgWidth = columnNum * columnWidth;
    this.setState({
      svgWidth,
      columnWidth,
      view: {
        ...this.state.view,
        widthPercent: this.gantt ? (viewWidth / svgWidth) : 0.1
      }
    });
  };

  onGanttScroll = () => {
    const { rowHeight, columnWidth, endDate, position } = this.state;
    const { bottomLimit: bLimit, rightLimit: rLimit, onScrollToBottom, onScrollToRight } = this.props;
    const { gantt } = this;
    const { scrollTop, scrollLeft, scrollWidth, scrollHeight, clientWidth, clientHeight } = gantt;
    const rightToLeft = clientWidth + scrollLeft;
    const bottomToTop = clientHeight + scrollTop;
    const bottomLimit = bLimit * rowHeight;
    const rightLimit = rLimit * columnWidth;

    // 是否水平滚动
    const isHScroll = position.y === scrollTop;

    this.setState({
      position: {
        x: scrollLeft,
        y: scrollTop
      },
      view: {
        widthPercent: clientWidth / scrollWidth,
        leftPercent: scrollLeft / scrollWidth
      }
    }, () => {
      if (!isHScroll && ((scrollHeight - bottomToTop) < bottomLimit)) {
        onScrollToBottom && onScrollToBottom(this.props.data);
      }
      if ((scrollWidth - rightToLeft) < rightLimit) {
        const lastDate = new Date(endDate);
        lastDate.setMonth(lastDate.getMonth() + 1);
        const nextMonth = getMonths(lastDate);
        const nextMonthLastDay = nextMonth[0];

        onScrollToRight && onScrollToRight(nextMonthLastDay.date);
      }
    });
  };

  onBarScroll = (leftPercent) => {
    const { gantt } = this;
    const { scrollWidth } = gantt;

    gantt.scrollLeft = scrollWidth * leftPercent;
    this.setState({
      view: {
        ...this.state.view,
        leftPercent
      }
    });
  };

  onBarResize = ({ widthPercent, leftPercent }) => {
    const { columnNum, view } = this.state;
    const { gantt } = this;
    const { scrollWidth, clientWidth } = gantt;
    const svgWidth = clientWidth / widthPercent;
    const columnWidth = svgWidth / columnNum;

    if (leftPercent !== view.leftPercent) gantt.scrollLeft = scrollWidth * leftPercent;
      this.setState({
        svgWidth,
        columnWidth,
        view: {
          leftPercent,
          widthPercent
        }
      });
  };

  initLayout = () => {
    const { startDate, endDate } = this.props;
    const dates = getPeriods(startDate, endDate);
    let days = 0;

    if (!dates) return;

    dates.forEach((month) => {
      days += month.length;
    });
    this.setState({
      startDate,
      endDate,
      viewNum: getDays(startDate).days,
      columnNum: days,
      dates
    }, () => {
      this.getWidth();
    });
  };

  render() {
    const { data } = this.props;

    const { columnNum, svgWidth, columnWidth, rowHeight, headerHeight, dates, position } = this.state;
    const canRender = dates && dates.length;
    return (
      <div className="q-gantt">
        <div className="q-gantt-chart" ref={gantt => this.gantt = gantt}
          style={{ width: '100%', minWidth: 400, minHeight: 200, maxHeight: 600, overflowX: 'hidden', overflowY: 'scroll' }}>
        {
          canRender ? <Chart data={data} options={{ width: svgWidth, columnWidth, columnNum, rowHeight, headerHeight, dataNum: data.length, dates, position }} />
                    : <p style={{ textAlign: 'center', color: '#ccc' }}>没有数据</p>
        }
        </div>
      </div>
    );
  }

  componentWillMount() {
    const { startDate, endDate, data } = this.props;
    if (startDate || endDate || data) this.initLayout();
  }

  componentWillReceiveProps({ startDate, endDate, data }) {
    const { startDate: prevStartDate, endDate: prevEndDate } = this.props;
    if ((startDate !== prevStartDate) || (endDate !== prevEndDate) || (data && data.length)) this.initLayout();
  }

  componentDidMount() {
    this.getWidth();
    this.throttledGetWidth = throttle(this.getWidth, 300);
    window.addEventListener('resize', this.throttledGetWidth);

    this.onGanttScroll();
    this.gantt.addEventListener('scroll', this.onGanttScroll);
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.throttledGetWidth);
    if (this.gantt) this.gantt.removeEventListener('scroll', this.onGanttScroll);
  }
}
