const { parsePositiveId } = require('../../helpers/validation');

/**
 * Парсит дату YYYY-MM-DD для фильтров list/count.
 * @param { unknown } str
 * @returns { string | null }
 */
function parseDate(str) {
  if (!str || typeof str !== 'string') return null;
  const trimmed = str.trim();
  if (!trimmed) return null;
  const m = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const [, y, mo, d] = m;
  const moNum = parseInt(mo, 10);
  const dNum = parseInt(d, 10);
  if (moNum < 1 || moNum > 12 || dNum < 1 || dNum > 31) return null;
  return `${parseInt(y, 10)}-${mo.padStart(2, '0')}-${d.padStart(2, '0')}`;
}

/**
 * @param { object } body
 * @returns {{ filters: object, sort: object, page: number, limit: number, offset: number }}
 */
function parseListBody(body) {
  const filters = body?.filters || {};
  const sort = body?.sort && body.sort[0] ? body.sort[0] : {};
  const page = Math.max(1, parseInt(body?.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(body?.limit, 10) || 10));
  const offset = (page - 1) * limit;
  return { filters, sort, page, limit, offset };
}

/**
 * @typedef { object } EventListWhereConfig
 * @property { string } tableAlias — префикс таблицы в FROM (ep / eo)
 * @property { string } dateColumn — полное имя столбца даты для фильтров
 * @property { string } existsEmployeeSql — EXISTS (...) для фильтра по employee_id
 * @property { (filters: object) => { clause: string, param: number } | null } resolveTypeFilter
 */

/**
 * @param { object } filters
 * @param { EventListWhereConfig } config
 * @returns {{ where: string, params: unknown[] }}
 */
function buildEventListWhere(filters, config) {
  const { dateColumn, existsEmployeeSql, resolveTypeFilter } = config;
  const where = [];
  const params = [];
  const dateFrom = parseDate(filters?.date_from);
  const dateTo = parseDate(filters?.date_to);
  const hasCustomRange = dateFrom || dateTo;

  if (hasCustomRange) {
    if (dateFrom) {
      where.push(` ${dateColumn} >= ? `);
      params.push(dateFrom);
    }
    if (dateTo) {
      where.push(` ${dateColumn} <= ? `);
      params.push(dateTo);
    }
  } else if (filters?.period && filters.period !== 'all') {
    switch (filters.period) {
      case 'this_month':
        where.push(
          ` ${dateColumn} >= DATE_FORMAT(NOW(), "%Y-%m-01") AND ${dateColumn} < DATE_ADD(DATE_FORMAT(NOW(), "%Y-%m-01"), INTERVAL 1 MONTH) `
        );
        break;
      case 'this_week':
        where.push(` YEARWEEK(${dateColumn}) = YEARWEEK(NOW()) `);
        break;
      case 'next_week':
        where.push(` YEARWEEK(${dateColumn}) = YEARWEEK(NOW())+1 `);
        break;
      case 'three_months':
        where.push(` ${dateColumn} >= CURDATE() AND ${dateColumn} <= DATE_ADD(CURDATE(), INTERVAL 3 MONTH) `);
        break;
      default:
        break;
    }
  }
  if (filters?.search && String(filters.search).trim()) {
    where.push(` ${config.tableAlias}.name LIKE ? `);
    params.push(`%${String(filters.search).trim()}%`);
  }
  const empId = parsePositiveId(filters?.employee_id);
  if (empId != null) {
    where.push(` ${existsEmployeeSql} `);
    params.push(empId);
  }
  const typePart = resolveTypeFilter(filters);
  if (typePart) {
    where.push(typePart.clause);
    params.push(typePart.param);
  }
  return { where: where.length ? ` WHERE ${where.join(' AND ')} ` : '', params };
}

/** Конфиг для мероприятий участия (part) */
const PART_LIST_WHERE = {
  tableAlias: 'ep',
  dateColumn: 'ep.registration_deadline',
  existsEmployeeSql:
    'EXISTS (SELECT 1 FROM responsible_for_part_events rp WHERE rp.id_event = ep.id AND rp.id_employee = ?)',
  resolveTypeFilter(filters) {
    const partTypeId = parsePositiveId(filters?.id_type ?? filters?.type_id);
    if (partTypeId == null) return null;
    return { clause: ' ep.id_type = ? ', param: partTypeId };
  },
};

/** Конфиг для мероприятий организации (org) */
const ORG_LIST_WHERE = {
  tableAlias: 'eo',
  dateColumn: 'eo.dates_of_event',
  existsEmployeeSql:
    'EXISTS (SELECT 1 FROM responsible_for_org_events ro WHERE ro.id_event = eo.id AND ro.id_employee = ?)',
  resolveTypeFilter(filters) {
    const orgTypeId = parsePositiveId(filters?.type);
    if (orgTypeId == null) return null;
    return { clause: ' eo.type = ? ', param: orgTypeId };
  },
};

function buildPartWhere(filters) {
  return buildEventListWhere(filters, PART_LIST_WHERE);
}

function buildOrgWhere(filters) {
  return buildEventListWhere(filters, ORG_LIST_WHERE);
}

module.exports = {
  parseDate,
  parseListBody,
  buildPartWhere,
  buildOrgWhere,
};
