import React, { Component, PropTypes } from 'react';
import { getDays } from './utils';

export default class Chart extends Component {
  static propTypes = {
    data: PropTypes.array,
    options: PropTypes.object
  };

  // 获取日历坐标系
  getCalendar = ({ columnWidth, headerHeight, dates }) => {
    const months = [];
    const days = [];
    let monthX = 0;
    dates.forEach((m) => {
      const mL = m.length;
      const mX1 = monthX;
      monthX += mL * columnWidth;
      const mX2 = monthX;

      months.push({
        x1: mX1,
        x2: mX2,
        y1: 0,
        y2: headerHeight / 2,
        textX: mX1 + (monthX - mX1) / 2,
        textY: headerHeight / 4,
        text: `${m[0].year}年${m[0].month}月`
      });

      let dayX = mX1;
      m.forEach((d) => {
        const dX1 = dayX;
        dayX += columnWidth;
        const dX2 = dayX;

        days.push({
          x1: dX1,
          x2: dX2,
          y1: headerHeight / 2,
          y2: headerHeight,
          textX: dX1 + (dayX - dX1) / 2,
          textY: headerHeight / 4 * 3,
          text: d.isToday ? '今' : d.day,
          ...d
        });
      });
    });

    return {
      months,
      days
    };
  };

    // 获取纵轴坐标系
    getVLines = ({ columnWidth, columnNum, dataNum, rowHeight }) => {
      const coordinate = [];
      for (let i = 0; i < columnNum + 1; i++) {
        coordinate.push([[i * columnWidth, 0], [i * columnWidth, dataNum * rowHeight]]);
      }
      return coordinate;
    };

    // 获取横轴坐标系
    getHLines = ({ columnWidth, columnNum, dataNum, rowHeight }) => {
      const coordinate = [];
      for (let i = 0; i < dataNum + 1; i++) {
        coordinate.push([[0, i * rowHeight], [columnNum * columnWidth, i * rowHeight]]);
      }
      return coordinate;
    };

    // 获取日期所对应的坐标起止x坐标，x1 -> x2
    getCoordinateFromDate = ({ startDate, endDate, days = [], columnWidth }) => {
      function findX(date) {
        const { year, month, day, hour } = getDays(date);
        const index = days.findIndex(({ year: y, month: m, day: d }) => (y === year && m === month && d === day));
        if (index < 0) return 0;

        const { x1 } = days[index];
        return hour * (columnWidth / 24) + x1;
      }
      return {
        x1: findX(startDate),
        x2: findX(endDate) || findX(startDate) // 0 || startDate
      };
    };

    render() {
      const { options, data } = this.props;
      const { width, headerHeight, rowHeight, columnWidth, dataNum, position, dates } = options;
      if (!dates || !dates.length) return null;
      const { months, days } = this.getCalendar(options);
      const vLines = this.getVLines(options);
      const hLines = this.getHLines(options);

      return (
          <svg
            className="g-gantt-chart-svg"
            version="1.1"
            baseProfile="full"
            width={width}
            height={rowHeight + rowHeight * dataNum}
            xmlns="http://www.w3.org/2000/svg"
          >
            <g className="q-gantt-body-container" transform={`translate(0, ${headerHeight})`}>
              <g className="q-gantt-body-lines">
                {
                  vLines.map(([[x1, y1], [x2, y2]], index) => (
                    <line
                      key={index}
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      strokeWidth="1"
                      strokeOpacity="0.09"
                      stroke="black"
                    />
                  ))
                }
                {
                  hLines.map(([[x1, y1], [x2, y2]], index) => (
                    index
                      ? (
                        <line
                          key={index}
                          x1={x1}
                          y1={y1}
                          x2={x2}
                          y2={y2}
                          strokeWidth="1"
                          strokeOpacity="0.09"
                          stroke="black"
                        />
                      )
                      : null
                  ))
                }
              </g>
              <g className="q-gantt-view-data-node">
                {
                  data.map((item, index) => {
                    const rectHeight = 22;
                    const rectBgColor = 'tomato';
                    const textColor = '#fff';
                    const titleColor = '#5a6c84';
                    const rectY = rowHeight * index + rectHeight * 0.85;
                    const textY = rectY + rectHeight / 2;
                    const titleY = rectY - 5;

                    if (item.nodes && item.nodes.length) {
                      return item.nodes.map((node, nodeIndex) => {
                        const { x1, x2 } = this.getCoordinateFromDate({
                          endDate: node.endDate,
                          startDate: node.startDate,
                          days,
                          columnWidth
                        });
                        const rectWidth = x2 - x1;

                        return (
                          <g
                            key={nodeIndex}
                            onClick={(e) => {
                              if (node.onClick) return node.onClick({ value: node }, e);
                              item.onClick && item.onClick({ value: item, index: nodeIndex }, e);
                            }}
                          >
                          {
                            nodeIndex === 0 ? <text
                              x={x1}
                              y={titleY}
                              textAnchor="start"
                              dominantBaseline="end"
                              fill={node.titleColor || item.titleColor || titleColor}
                            >{item.title}</text>
                            : null
                          }
                          <rect
                            x={x1}
                            y={rectY}
                            width={rectWidth || '44.838709677419274'}
                            height={rectHeight}
                            fill={node.backgroundColor || item.background || rectBgColor}
                          />
                          <text
                            x={x1 + rectWidth / 2}
                            y={textY}
                            textAnchor="middle"
                            dominantBaseline="central"
                            fill={node.color || item.color || textColor}
                          >{node.content}</text>
                      </g>
                    );
                  });
                }

                const { x1, x2 } = this.getCoordinateFromDate({
                    endDate: item.endDate,
                    startDate: item.startDate,
                    days,
                    columnWidth
                });
                const rectWidth = x2 - x1;
                  return (
                    <g
                      key={index}
                      onClick={(e) => {
                        item.onClick && item.onClick({ value: item }, e);
                      }}
                    >
                    <text
                      x={x1}
                      y={titleY}
                      textAnchor="start"
                      dominantBaseline="end"
                      fill={item.titleColor || titleColor}
                    >{item.title}</text>
                    <rect
                      x={x1}
                      y={rectY}
                      width={rectWidth}
                      height={rectHeight}
                      fill={item.backgroundColor || rectBgColor}
                    />
                    <text
                      x={x1 + rectWidth / 2}
                      y={textY}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fill={item.color || textColor}
                    >{item.content}</text>
                  </g>
                  );
                })
              }
            </g>
            </g>
            <g
              className="q-gantt-header-container"
              transform={`translate(0, ${position.y})`}
              style={{ transition: 'transform .05s' }}
              >
              <g className="q-gantt-header-lines">
                {
                  position.y > 0 ? (
                  <rect
                    width={width}
                    height={position.y * rowHeight}
                    x={0}
                    y={-position.y * rowHeight}
                    fill="#fff"
                    stroke="none" />
                    )
                    : null
                  }
                    <rect
                      width={width}
                      height={headerHeight}
                      strokeWidth="1"
                      strokeOpacity="0.09"
                      stroke="black"
                      fill="#E9EDF2"
                    />
                    <line
                      x1="0"
                      y1={headerHeight / 2}
                      x2={width}
                      y2={headerHeight / 2}
                      strokeWidth="1"
                      strokeOpacity="0.09"
                      stroke="black"
                    />
                  </g>
                  {
                    months.map(({ text, textX, textY, x2, y1, y2 }, index) => (
                      <g className="q-gantt-header-month" key={index}>
                        <text
                          x={textX}
                          y={textY}
                          textAnchor="middle"
                          dominantBaseline="central"
                          fill="#5a6c84"
                        >{text}</text>
                        <line
                          x1={x2}
                          y1={y1}
                          x2={x2}
                          y2={y2}
                          strokeWidth="1"
                          strokeOpacity="0.09"
                          stroke="black"
                        />
                      </g>
                    ))
                  }
                  {
                    days.map(({ isToday, text, textX, textY, weekend, x1, x2, y1, y2 }, index) => (
                      <g className="q-gantt-header-day" key={index}>
                        <text
                          x={textX}
                          y={textY}
                          textAnchor="middle"
                          dominantBaseline="central"
                          fill={weekend ? 'orange' : '#5a6c84'}
                          >{text}</text>
                          <line
                            x1={x2}
                            y1={y1}
                            x2={x2}
                            y2={y2}
                            strokeWidth="1"
                            strokeOpacity="0.09"
                            stroke="black"
                          />
                          {
                            isToday
                              ? (
                                <rect
                                  x={x1}
                                  y={y1 + rowHeight / 2}
                                  width={columnWidth}
                                  height={18}
                                  fill="#EEF8FF"
                                  fillOpacity="0.5"
                                />
                              )
                              : null
                          }
                      </g>
                    ))
                  }
              </g>
          </svg>
      );
    }
}
