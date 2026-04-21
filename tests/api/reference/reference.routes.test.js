const { expectRouteToUse } = require('../../helpers/routeBindings');

describe('Reference: роуты вызывают нужные функции контроллера', () => {
  const router = require('../../../src/api/modules/reference/routes');
  const controller = require('../../../src/api/modules/reference/controller');

  test('GET /rooms → getRooms', () => expectRouteToUse(router, 'get', '/rooms', controller.getRooms));
  test('GET /access → getAccess', () => expectRouteToUse(router, 'get', '/access', controller.getAccess));
  test('GET /access/:employeeId → getAccessByEmployee', () =>
    expectRouteToUse(router, 'get', '/access/:employeeId', controller.getAccessByEmployee));
  test('GET /positions → getPositions', () => expectRouteToUse(router, 'get', '/positions', controller.getPositions));
  test('GET /docs → getDocs', () => expectRouteToUse(router, 'get', '/docs', controller.getDocs));
  test('POST /docs → addDoc', () => expectRouteToUse(router, 'post', '/docs', controller.addDoc));
  test('PUT /docs/:id → updateDoc', () => expectRouteToUse(router, 'put', '/docs/:id', controller.updateDoc));
  test('DELETE /docs/:id → deleteDoc', () => expectRouteToUse(router, 'delete', '/docs/:id', controller.deleteDoc));
  test('GET /types-of-holding → getTypesOfHolding', () => expectRouteToUse(router, 'get', '/types-of-holding', controller.getTypesOfHolding));
  test('GET /levels → getLevels', () => expectRouteToUse(router, 'get', '/levels', controller.getLevels));
  test('GET /types-of-organization → getTypesOfOrganization', () =>
    expectRouteToUse(router, 'get', '/types-of-organization', controller.getTypesOfOrganization));
  test('GET /student-statuses → getStudentStatuses', () =>
    expectRouteToUse(router, 'get', '/student-statuses', controller.getStudentStatuses));
  test('POST /positions → addPosition', () =>
    expectRouteToUse(router, 'post', '/positions', controller.addPosition));
  test('PUT /positions/:id → updatePosition', () =>
    expectRouteToUse(router, 'put', '/positions/:id', controller.updatePosition));
  test('DELETE /positions/:id → deletePosition', () =>
    expectRouteToUse(router, 'delete', '/positions/:id', controller.deletePosition));
});
