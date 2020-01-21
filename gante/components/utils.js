/**
 * 获取当前日期对应的天数详情
 * @param date
 * @returns {{date: Date, year: number, month: number, day: number, week: number, hour: number, minute: number, second: number, days: number}}
 */

export const getDays = (date = new Date()) => {
  date = new Date(date);
  const originDate = date;
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const week = date.getDay() || 7;
  const hour = date.getHours();
  const minute = date.getMinutes();
  const second = date.getSeconds();
  date.setMonth(month);
  date.setDate(0);
  const days = date.getDate();
  return {
    date: originDate,
    year,
    month,
    day,
    week,
    hour,
    minute,
    second,
    days
  };
};

/**
 * 获取当前日期对应的月份天数详情
 * @param date
 * @returns {Array}
 */
export const getMonths = (date = new Date()) => {
  date = new Date(date);

  const today = new Date();
  const current = getDays(date);
  const { year, month, days } = current;
  const currentDate = current.date;
  const months = [];
  for (let i = 1; i < days + 1; i++) {
    currentDate.setDate(i);
    const week = currentDate.getDay() || 7;
    const weekend = week === 6 || week === 7;
    const isToday = (today.getFullYear() === year) && ((today.getMonth() + 1) === month) && (today.getDate() === i);

    months.push({
      year,
      month,
      day: i,
      isToday,
      week,
      weekend,
      date: new Date(`${year}/${month}/${i} 00:00:00`)
    });
  }

  return months;
};

/**
 * 获取周期范围内的月份天数详情
 * @param startDate
 * @param endDate
 * @returns {Array}
 */
export const getPeriods = (startDate, endDate) => {
  if (!startDate || !endDate) return;
  startDate = new Date(startDate);
  endDate = new Date(endDate);
  const startYear = startDate.getFullYear();
  const endYear = endDate.getFullYear();
  const startMonth = startDate.getMonth() + 1;
  const endMonth = endDate.getMonth() + 1;
  const periods = [];
  if (startYear === endYear) {
    if (startMonth === endMonth) {
      periods.push(getMonths(startDate));
      return periods;
    }

    for (let i = startMonth; i <= endMonth; i++) {
      const current = new Date(`${startYear}/${i}/1`);
      periods.push(getMonths(current));
    }
    return periods;
  }

  for (let i = startYear; i <= endYear; i++) {
    let j = startMonth;
    let max = 12;
    if (i === endYear) {
      j = 1;
      max = endMonth;
    }

    for (j; j <= max; j++) {
      const current = new Date(`${i}/${j}/1`);
      periods.push(getMonths(current));
    }
  }
  return periods;
};
