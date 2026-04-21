const { expectRouteToUse } = require('../../helpers/routeBindings');

describe('Employees: роуты вызывают нужные функции контроллера', () => {
  const router = require('../../../src/api/modules/employees/routes');
  const controller = require('../../../src/api/modules/employees/controller');

  test('GET / → getAllEmployees', () => {
    expectRouteToUse(router, 'get', '/', controller.getAllEmployees);
  });

  test('GET /all → getAllEmployeesLegacy', () => {
    expectRouteToUse(router, 'get', '/all', controller.getAllEmployeesLegacy);
  });

  test('GET /with-inactive → getAllWithInactive', () => {
    expectRouteToUse(router, 'get', '/with-inactive', controller.getAllWithInactive);
  });

  test('GET /schedule → getSchedule', () => {
    expectRouteToUse(router, 'get', '/schedule', controller.getSchedule);
  });

  test('GET /short-list → getShortList', () => {
    expectRouteToUse(router, 'get', '/short-list', controller.getShortList);
  });

  test('GET /sizes → getSizes', () => {
    expectRouteToUse(router, 'get', '/sizes', controller.getSizes);
  });

  test('GET /search → searchByLetter', () => {
    expectRouteToUse(router, 'get', '/search', controller.searchByLetter);
  });

  test('GET /search/:letter → searchByLetter', () => {
    expectRouteToUse(router, 'get', '/search/:letter', controller.searchByLetter);
  });

  test('GET /kpi/:id → getKpi', () => {
    expectRouteToUse(router, 'get', '/kpi/:id', controller.getKpi);
  });

  test('GET /:id → getById', () => {
    expectRouteToUse(router, 'get', '/:id', controller.getById);
  });

  test('POST / → assignToEvent', () => {
    expectRouteToUse(router, 'post', '/', controller.assignToEvent);
  });

  test('POST /add → addEmployee', () => {
    expectRouteToUse(router, 'post', '/add', controller.addEmployee);
  });

  test('PUT /kpi → setKpi', () => {
    expectRouteToUse(router, 'put', '/kpi', controller.setKpi);
  });

  test('PUT /contact → updateContact', () => {
    expectRouteToUse(router, 'put', '/contact', controller.updateContact);
  });

  test('PUT /size → updateSize', () => {
    expectRouteToUse(router, 'put', '/size', controller.updateSize);
  });

  test('PUT /:id → updateEmployee', () => {
    expectRouteToUse(router, 'put', '/:id', controller.updateEmployee);
  });

  test('DELETE /:id → deleteEmployee', () => {
    expectRouteToUse(router, 'delete', '/:id', controller.deleteEmployee);
  });
});
