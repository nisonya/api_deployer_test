const { expectRouteToUse } = require('../../helpers/routeBindings');

describe('Schedule: роуты вызывают нужные функции контроллера', () => {
  const router = require('../../../src/api/modules/schedule/routes');
  const controller = require('../../../src/api/modules/schedule/controller');

  test('GET / → getSchedule', () => expectRouteToUse(router, 'get', '/', controller.getSchedule));
  test('GET /teachers → getTeachers', () => expectRouteToUse(router, 'get', '/teachers', controller.getTeachers));
  test('GET /groups → getGroups', () => expectRouteToUse(router, 'get', '/groups', controller.getGroups));
  test('POST /by-date → getScheduleByDate', () => expectRouteToUse(router, 'post', '/by-date', controller.getScheduleByDate));
  test('GET /by-teacher/:id → getScheduleByTeacher', () => expectRouteToUse(router, 'get', '/by-teacher/:id', controller.getScheduleByTeacher));
  test('GET /by-group/:id → getScheduleByGroup', () => expectRouteToUse(router, 'get', '/by-group/:id', controller.getScheduleByGroup));
  test('GET /by-room/:id → getScheduleByRoom', () => expectRouteToUse(router, 'get', '/by-room/:id', controller.getScheduleByRoom));
  test('POST / → addSchedule', () => expectRouteToUse(router, 'post', '/', controller.addSchedule));
  test('PUT / → updateSchedule', () => expectRouteToUse(router, 'put', '/', controller.updateSchedule));
  test('DELETE /:id → deleteSchedule', () => expectRouteToUse(router, 'delete', '/:id', controller.deleteSchedule));
});
