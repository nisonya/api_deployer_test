const { expectRouteToUse } = require('../../helpers/routeBindings');

describe('Attendance: роуты вызывают нужные функции контроллера', () => {
  const router = require('../../../src/api/modules/attendance/routes');
  const controller = require('../../../src/api/modules/attendance/controller');

  test('GET /by-group/:id → getByGroup', () => expectRouteToUse(router, 'get', '/by-group/:id', controller.getByGroup));
  test('PUT /by-group-date → getByGroupAndDate', () => expectRouteToUse(router, 'put', '/by-group-date', controller.getByGroupAndDate));
  test('PUT /by-group-date-new → getByGroupAndDateNew', () => expectRouteToUse(router, 'put', '/by-group-date-new', controller.getByGroupAndDateNew));
  test('POST / → newAttendance', () => expectRouteToUse(router, 'post', '/', controller.newAttendance));
});
