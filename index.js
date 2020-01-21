'use strict';

import React from 'react';
import moment from 'moment';
import Gantt from './gantt';
import { ganteData } from './utils/constants';

class GanteList extends React.Component {
  constructor () {
    super();
    this.state = {
      monthDateStart: '',
      monthDateEnd: '',
      isLoading: false,
      tagCount: 0
    };
  }

  componentDidMount = () => {
    const date = new Date();
    const y = date.getFullYear();
    const m = date.getMonth();
    const firstDay = new Date(y, m, 1).getTime();
    const lastDay = new Date(y, m + 1, 0).getTime();
    const firstDayStr = moment(firstDay).format('YYYY-MM-DD');
    const lastDayStr = moment(lastDay).format('YYYY-MM-DD');

    this.setState({
      monthDateStart: firstDayStr,
      monthDateEnd: lastDayStr
    });
  }

  addTime (d) {
    return d + 1 * 24 * 60 * 60 * 1000;
  }

  getLevelBgColor (level, bgOpacity = 1) {
    switch (level) {
      case 1:
        return `rgba(87, 144, 242, ${bgOpacity})`;
      case 2:
        return `rgba(47, 107, 230, ${bgOpacity})`;
      case 3:
        return `rgba(189, 189, 189, ${bgOpacity})`;
      case 4:
        default:
        return `rgba(158, 158, 158, ${bgOpacity})`;
    }
  }

  getDate (date, day = 0) {
    if (!date) return date;
    const timeStamp = new Date(date).getTime();
    return new Date(timeStamp + day * 24 * 3600 * 1000);
  }

  formatGanttData (list) {
    if (!list) return [];
    return list.map((item) => {
      const { deversionName, ruleNum } = item;
      const title = `${deversionName}`;
      let color = '#fff';
      let backgroundColor = this.getLevelBgColor(ruleNum);

      let nodes = [];
      item.deversionDetails.map((si) => {
        nodes.push({
          startDate: si.startDate,
          endDate: this.addTime(si.endDate),
          backgroundColor: this.getLevelBgColor(si.ruleNum, 0.7),
          configId: si.configId,
          configDetailId: si.configDetailId,
          onClick: ({ value: { configDetailId, configId, startDate } }) => {
            this.props.dispatch({
              type: 'taskList/queryDetails',
              isShow: true,
              startDate,
              id: configDetailId,
              configId
            });
          }
        });
      });
      return {
        origin: item,
        title,
        titleColor: '#000',
        color,
        backgroundColor,
        nodes
      };
    });
  }

  render () {
    const { monthDateStart, monthDateEnd } = this.state;
    const motherFristDay = new Date(monthDateStart).getTime();
    const motherLastDay = new Date(monthDateEnd).getTime();
    return (
      <div className='wdk-task-list'>
        {
          ganteData.map(item => (
            <Gantt
              key={item.deliveryDockCode}
              data={this.formatGanttData(item.deversions)}
              startDate={motherFristDay}
              endDate={motherLastDay}
              rightLimit={31}
              bottomLimit={2}
            />
          ))
        }
      </div>
    );
  }
}

export default GanteList;
