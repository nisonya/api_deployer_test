/**
 * Генерирует Word-документ с документацией API.
 * Модули → HTTP-методы → эндпоинты с описанием запроса/ответа.
 */

const fs = require('fs');
const path = require('path');
const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  HeadingLevel,
  AlignmentType,
  WidthType,
  BorderStyle,
} = require('docx');

const API_DATA = {
  auth: {
    name: 'Auth — Авторизация',
    basePath: '/api/auth',
    tokenRequired: false,
    endpoints: {
      POST: [
        {
          path: '/api/auth/login',
          description: 'Вход по логину и паролю',
          request: 'login (string), password (string)',
          response: 'accessToken, refreshToken, user: { id, accessLevel }',
          type: 'object',
        },
        {
          path: '/api/auth/refresh',
          description: 'Обновить access-токен',
          request: 'refreshToken (string)',
          response: 'accessToken',
          type: 'object',
        },
        {
          path: '/api/auth/logout',
          description: 'Выход, отзыв refresh-токена',
          request: 'refreshToken (string, опционально)',
          response: 'success',
          type: 'object',
        },
      ],
    },
  },
  employees: {
    name: 'Employees — Сотрудники',
    basePath: '/api/employees',
    tokenRequired: true,
    endpoints: {
      GET: [
        { path: '/api/employees', description: 'Список активных с должностью', request: '—', response: 'Массив: id_employees, first_name, second_name, patronymic, position, position_name', type: 'array' },
        { path: '/api/employees/all', description: 'Полные поля сотрудников', request: '—', response: 'Массив: id_employees, first_name, second_name, patronymic, date_of_birth, position, contact, size, education, schedule, gender', type: 'array' },
        { path: '/api/employees/schedule', description: 'Расписание занятий', request: '—', response: 'Массив: id_employees, id_schedule, room_id, employee_name, day_name, startTime, endTime, room_name', type: 'array' },
        { path: '/api/employees/short-list', description: 'Краткий список id и имя', request: '—', response: 'Массив: { id, name }', type: 'array' },
        { path: '/api/employees/sizes', description: 'id, имя, пол, размер', request: '—', response: 'Массив: { id, name, gender, size }', type: 'array' },
        { path: '/api/employees/search', description: 'Поиск по букве (query)', request: 'letter (query)', response: 'Массив: { id_employees, name }', type: 'array' },
        { path: '/api/employees/search/:letter', description: 'Поиск по букве в пути', request: 'letter (path)', response: 'Массив: { id_employees, name }', type: 'array' },
        { path: '/api/employees/kpi/:id', description: 'KPI сотрудника', request: 'id (path)', response: 'Объект: { KPI }', type: 'object' },
        { path: '/api/employees/:id', description: 'Один сотрудник', request: 'id (path)', response: 'Объект: id_employees, first_name, second_name, patronymic, date_of_birth, position, position_name, contact, size, education, schedule, gender, KPI, is_active', type: 'object' },
      ],
      POST: [
        { path: '/api/employees', description: 'Назначить на мероприятие', request: 'event_id, employee_id (number)', response: 'success, message', type: 'object' },
        { path: '/api/employees/add', description: 'Добавить сотрудника', request: 'first_name, second_name, patronymic, date_of_birth, position, login, password, access_level_id; опц.: contact, size, education, schedule, gender, KPI', response: 'success, data: { id }', type: 'object' },
      ],
      PUT: [
        { path: '/api/employees/kpi', description: 'Установить KPI', request: 'id, KPI (string)', response: 'success, data: { ok }', type: 'object' },
        { path: '/api/employees/contact', description: 'Обновить контакт', request: 'id, contact', response: 'success, data: { ok }', type: 'object' },
        { path: '/api/employees/size', description: 'Обновить размер', request: 'id, size', response: 'success, data: { ok }', type: 'object' },
      ],
    },
  },
  eventsOrg: {
    name: 'Events (org) — Мероприятия организации',
    basePath: '/api/events/org',
    tokenRequired: true,
    endpoints: {
      GET: [
        { path: '/api/events/org/resp-table', description: 'Таблица ответственных', request: '—', response: 'Массив (responsible_for_org_events)', type: 'array' },
        { path: '/api/events/org/full-inf/:id', description: 'Полная информация о мероприятии', request: 'id (path)', response: 'Объект: id, name, form_of_holding, dates_of_event, day_of_the_week, amount_of_applications, amount_of_planning_application, annotation, result, type (id types_of_organization), link; справочник типов: GET /api/reference/types-of-organization', type: 'object' },
        { path: '/api/events/org/responsible/:id', description: 'Ответственные по мероприятию', request: 'id (path)', response: 'Массив: { id_event, id_employees, first_name, second_name }', type: 'array' },
        { path: '/api/events/org/notifications-today/:id', description: 'Мероприятия сотрудника на сегодня', request: 'id (path) — id сотрудника', response: 'Массив: { id, name, dates_of_event, day_of_the_week }', type: 'array' },
        { path: '/api/events/org/notifications-tomorrow/:id', description: 'Мероприятия сотрудника на завтра', request: 'id (path)', response: 'Массив: { id, name, dates_of_event, day_of_the_week }', type: 'array' },
      ],
      POST: [
        { path: '/api/events/org/list', description: 'Список с фильтрами и пагинацией', request: 'filters: period или date_from/date_to; опц.: search, employee_id, type (id types_of_organization); sort; page, limit', response: 'success, data: [{ id, name, dates_of_event, day_of_the_week, type }], page, limit', type: 'array' },
        { path: '/api/events/org/count', description: 'Количество по фильтрам', request: 'filters: те же, что у org/list', response: 'success, total', type: 'object' },
        { path: '/api/events/org', description: 'Создать мероприятие', request: 'name, form_of_holding, dates_of_event, day_of_the_week, amount_of_applications, amount_of_planning_application, annotation, result', response: 'success, id', type: 'object' },
        { path: '/api/events/org/responsible', description: 'Добавить ответственного', request: 'id_employee / id_employees, id_event', response: 'success, data: { ok }', type: 'object' },
      ],
      PUT: [
        { path: '/api/events/org/notifications', description: 'Мероприятия сотрудника на дату', request: 'id_employee, date (YYYY-MM-DD)', response: 'success, data (массив)', type: 'array' },
        { path: '/api/events/org', description: 'Обновить мероприятие', request: 'id + поля создания; опц.: type, link', response: 'success, data: { ok }', type: 'object' },
      ],
      DELETE: [
        { path: '/api/events/org/responsible', description: 'Удалить связь ответственный–мероприятие', request: 'id_employee, id_event (body)', response: 'success, data: { ok }', type: 'object' },
        { path: '/api/events/org/:id', description: 'Удалить мероприятие', request: 'id (path)', response: 'success, data: { ok }', type: 'object' },
      ],
    },
  },
  eventsPart: {
    name: 'Events (part) — Мероприятия участия',
    basePath: '/api/events/part',
    tokenRequired: true,
    endpoints: {
      GET: [
        { path: '/api/events/part/resp-table', description: 'Таблица ответственных', request: '—', response: 'Массив (responsible_for_part_events)', type: 'array' },
        { path: '/api/events/part/full-inf/:id', description: 'Полная информация о мероприятии участия', request: 'id (path)', response: 'Объект: form_of_holding и id_type — числа (справочники form_of_holding, type_of_part_event); остальные поля мероприятия; см. GET /api/reference/types-of-holding и /levels', type: 'object' },
        { path: '/api/events/part/responsible/:id', description: 'Ответственные по мероприятию', request: 'id (path)', response: 'Массив: { id_event, id_employees, first_name, second_name, mark_of_sending_an_application }', type: 'array' },
        { path: '/api/events/part/responsible-new/:id', description: 'Ответственные + result_of_responsible', request: 'id (path)', response: 'Массив: то же + result_of_responsible', type: 'array' },
        { path: '/api/events/part/notifications-today/:id', description: 'Мероприятия с дедлайном сегодня', request: 'id (path)', response: 'Массив', type: 'array' },
        { path: '/api/events/part/notifications-tomorrow/:id', description: 'Мероприятия с дедлайном завтра', request: 'id (path)', response: 'Массив', type: 'array' },
      ],
      POST: [
        { path: '/api/events/part/list', description: 'Список с фильтрами и пагинацией', request: 'filters: period или date_from/date_to (по registration_deadline); опц.: search, employee_id, id_type или type_id (id type_of_part_event); sort; page, limit', response: 'success, data: [{ id, name, registration_deadline, participants_amount, result, id_type }], page, limit', type: 'array' },
        { path: '/api/events/part/count', description: 'Количество по фильтрам', request: 'filters: те же, что у part/list', response: 'success, total', type: 'object' },
        { path: '/api/events/part', description: 'Создать мероприятие участия', request: 'name, form_of_holding, id_type, registration_deadline, participants_and_works, annotation, dates_of_event, link, participants_amount, winner_amount, runner_up_amount, result (опц.)', response: 'success, id', type: 'object' },
        { path: '/api/events/part/responsible', description: 'Добавить ответственного', request: 'id_employee / id_employees, id_event', response: 'success, data: { ok }', type: 'object' },
      ],
      PUT: [
        { path: '/api/events/part/notifications', description: 'Мероприятия с дедлайном на дату', request: 'id_employee, date (YYYY-MM-DD)', response: 'success, data (массив)', type: 'array' },
        { path: '/api/events/part', description: 'Обновить мероприятие', request: 'id + поля создания', response: 'success, data: { ok }', type: 'object' },
        { path: '/api/events/part/result', description: 'Обновить результат ответственного', request: 'id_event, id_employee / id_employees, result_of_responsible (опц.)', response: 'success, data: { ok }', type: 'object' },
        { path: '/api/events/part/mark', description: 'Обновить отметку отправки заявки', request: 'id_event, id_employee / id_employees, mark_of_sending_an_application (0 или 1)', response: 'success, data: { ok }', type: 'object' },
      ],
      DELETE: [
        { path: '/api/events/part/responsible', description: 'Удалить ответственного', request: 'id_employee, id_event (body)', response: 'success, data: { ok }', type: 'object' },
        { path: '/api/events/part/:id', description: 'Удалить мероприятие', request: 'id (path)', response: 'success, data: { ok }', type: 'object' },
      ],
    },
  },
  schedule: {
    name: 'Schedule — Расписание',
    basePath: '/api/schedule',
    tokenRequired: true,
    endpoints: {
      GET: [
        { path: '/api/schedule', description: 'Полное расписание', request: '—', response: 'Массив: id, room, group, startTime, endTime, day, id_employees', type: 'array' },
        { path: '/api/schedule/teachers', description: 'Список преподавателей', request: '—', response: 'Массив: { id, name }', type: 'array' },
        { path: '/api/schedule/groups', description: 'Список групп', request: '—', response: 'Массив: { id, name }', type: 'array' },
        { path: '/api/schedule/by-teacher/:id', description: 'Расписание по преподавателю', request: 'id (path)', response: 'Массив (занятия)', type: 'array' },
        { path: '/api/schedule/by-group/:id', description: 'Расписание по группе', request: 'id (path)', response: 'Массив (занятия)', type: 'array' },
        { path: '/api/schedule/by-room/:id', description: 'Расписание по комнате', request: 'id (path)', response: 'Массив (занятия)', type: 'array' },
      ],
      POST: [
        { path: '/api/schedule/by-date', description: 'Занятия по дате и комнате', request: 'date (YYYY-MM-DD), room_id', response: 'success, data (массив)', type: 'array' },
        { path: '/api/schedule', description: 'Добавить занятие', request: 'room_id, group_id, start_time, end_time, day (1–7), employee_id', response: 'success, data: { id }', type: 'object' },
      ],
      PUT: [
        { path: '/api/schedule', description: 'Обновить занятие', request: 'id, room_id, group_id, start_time, end_time', response: 'success, data: { ok }', type: 'object' },
      ],
      DELETE: [
        { path: '/api/schedule/:id', description: 'Удалить занятие', request: 'id (path)', response: 'success, data: { ok }', type: 'object' },
      ],
    },
  },
  reference: {
    name: 'Reference — Справочники',
    basePath: '/api/reference',
    tokenRequired: true,
    endpoints: {
      GET: [
        { path: '/api/reference/rooms', description: 'Список комнат', request: '—', response: 'Массив: { id, name }', type: 'array' },
        { path: '/api/reference/access', description: 'Уровни доступа', request: '—', response: 'Массив: { id, name }', type: 'array' },
        { path: '/api/reference/positions', description: 'Должности', request: '—', response: 'Массив: { id, name }', type: 'array' },
        { path: '/api/reference/docs', description: 'Документы', request: '—', response: 'Массив (поля таблицы documents)', type: 'array' },
        { path: '/api/reference/types-of-holding', description: 'Форматы проведения', request: '—', response: 'Массив (form_of_holding)', type: 'array' },
        { path: '/api/reference/types-of-organization', description: 'Типы мероприятий организации (types_of_organization)', request: '—', response: 'Массив: { id, name } — id = id_type для поля type в event_plan_organization', type: 'array' },
        { path: '/api/reference/levels', description: 'Уровни мероприятий участия', request: '—', response: 'Массив: { id, name }', type: 'array' },
      ],
    },
  },
  rent: {
    name: 'Rent — Аренда помещений',
    basePath: '/api/rent',
    tokenRequired: true,
    endpoints: {
      GET: [
        { path: '/api/rent/by-event/:id', description: 'Список аренд по мероприятию', request: 'id (path)', response: 'Массив', type: 'array' },
        { path: '/api/rent/by-id/:id', description: 'Одна запись аренды', request: 'id (path)', response: 'Объект: event_id, room_id, date, start_time, end_time', type: 'object' },
      ],
      POST: [
        { path: '/api/rent/by-date-room', description: 'Аренды на дату и комнату', request: 'date (YYYY-MM-DD), room_id', response: 'success, data (массив)', type: 'array' },
        { path: '/api/rent', description: 'Создать аренду', request: 'event_id, room_id, date, start_time, end_time', response: 'success, data: { id }', type: 'object' },
      ],
      PUT: [
        { path: '/api/rent', description: 'Обновить аренду', request: 'id, event_id, room_id, date, start_time, end_time', response: 'success, data: { ok }', type: 'object' },
      ],
      DELETE: [
        { path: '/api/rent/:id', description: 'Удалить аренду', request: 'id (path)', response: 'success, data: { ok }', type: 'object' },
      ],
    },
  },
  students: {
    name: 'Students — Студенты',
    basePath: '/api/students',
    tokenRequired: true,
    endpoints: {
      GET: [
        { path: '/api/students/search', description: 'Поиск по фамилии (буква)', request: 'letter (query)', response: 'Массив', type: 'array' },
        { path: '/api/students/search/:letter', description: 'Поиск, буква в пути', request: 'letter (path)', response: 'Массив', type: 'array' },
        { path: '/api/students/search-new', description: 'Поиск с isActive, кол-во групп', request: '—', response: 'Массив', type: 'array' },
        { path: '/api/students/search-new/:letter', description: 'Поиск с letter', request: 'letter (path)', response: 'Массив', type: 'array' },
        { path: '/api/students/groups-by-student/:id', description: 'Группы студента', request: 'id (path)', response: 'Массив', type: 'array' },
        { path: '/api/students/by-group/:id', description: 'Краткий список студентов группы', request: 'id (path)', response: 'Массив: { id, name }', type: 'array' },
        { path: '/api/students/full-by-group/:id', description: 'Полная информация по студентам группы', request: 'id (path)', response: 'Массив (все поля)', type: 'array' },
        { path: '/api/students/:id', description: 'Полная информация о студенте', request: 'id (path)', response: 'Объект (один студент)', type: 'object' },
      ],
      POST: [
        { path: '/api/students/add-to-group', description: 'Добавить студента в группу', request: 'student_id, group_id', response: 'success, data: { ok }', type: 'object' },
        { path: '/api/students', description: 'Создать студента', request: 'surname, name, patronymic, birthDay, parentSurname, parentName, parentPatronymic, email, phone; опц.: navigator', response: 'success, data: { id }', type: 'object' },
      ],
      PUT: [
        { path: '/api/students/exist', description: 'Проверить существование по ФИО', request: 'surname, name, patronymic', response: 'success, data: { amount }', type: 'object' },
        { path: '/api/students', description: 'Обновить студента', request: 'id + поля как при создании', response: 'success, data: { ok }', type: 'object' },
        { path: '/api/students/update-to-group', description: 'Перевести из группы в группу', request: 'student_id, old_group_id, new_group_id', response: 'success, data: { ok }', type: 'object' },
      ],
      DELETE: [
        { path: '/api/students/from-group', description: 'Удалить студента из группы', request: 'student_id, group_id (body)', response: 'success, data: { ok }', type: 'object' },
      ],
    },
  },
  attendance: {
    name: 'Attendance — Посещаемость',
    basePath: '/api/attendance',
    tokenRequired: true,
    endpoints: {
      GET: [
        { path: '/api/attendance/by-group/:id', description: 'Посещаемость по группе', request: 'id (path)', response: 'Массив: name, date_of_lesson, presence', type: 'array' },
      ],
      PUT: [
        { path: '/api/attendance/by-group-date', description: 'Посещаемость по группе и дате', request: 'group_id, date', response: 'success, data: name, date_of_lesson, presence', type: 'array' },
        { path: '/api/attendance/by-group-date-new', description: 'То же с id_student', request: 'group_id, date', response: 'success, data: то же + id_student', type: 'array' },
      ],
      POST: [
        { path: '/api/attendance', description: 'Создать/обновить запись (upsert)', request: 'student_id, group_id, date_of_lesson (YYYY-MM-DD), presence (0/1)', response: 'success, data: { ok }', type: 'object' },
      ],
    },
  },
  groups: {
    name: 'Groups — Группы',
    basePath: '/api/groups',
    tokenRequired: true,
    endpoints: {
      GET: [
        { path: '/api/groups/by-teacher/:id', description: 'Группы преподавателя', request: 'id (path)', response: 'Массив', type: 'array' },
        { path: '/api/groups/table', description: 'Таблица students_groups', request: '—', response: 'Массив (все записи)', type: 'array' },
        { path: '/api/groups/pixels/:id', description: 'Пиксели студентов по группе', request: 'id (path)', response: 'Массив: name + поля pixels', type: 'array' },
        { path: '/api/groups/list', description: 'Список групп', request: '—', response: 'Массив: { id, name }', type: 'array' },
      ],
      PUT: [
        { path: '/api/groups/pixels', description: 'Обновить пиксели студента', request: 'id_student или id; поля: part_of_comp, make_content, invite_friend, clean_kvantum, filled_project_card_on_time, finished_project_with_product, regional_competition, interregional_competition, all_russian_competition, international_competition, nto, become_an_engineering_volunteer, help_with_event, make_own_event, special_achievements, fine', response: 'success, data: { ok, affected }', type: 'object' },
      ],
    },
  },
};

function createTableCell(text, bold = false) {
  return new TableCell({
    children: [
      new Paragraph({
        children: [new TextRun({ text: text || '—', bold })],
      }),
    ],
  });
}

function createEndpointTable(endpoints) {
  const headerRow = new TableRow({
    children: [
      createTableCell('Путь', true),
      createTableCell('Описание', true),
      createTableCell('Данные запроса', true),
      createTableCell('Данные ответа', true),
      createTableCell('Тип ответа', true),
    ],
  });
  const rows = [headerRow];
  for (const ep of endpoints) {
    rows.push(
      new TableRow({
        children: [
          createTableCell(ep.path),
          createTableCell(ep.description),
          createTableCell(ep.request),
          createTableCell(ep.response),
          createTableCell(ep.type === 'array' ? 'Массив' : 'Объект'),
        ],
      })
    );
  }
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows,
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
      left: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
      right: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
      insideVertical: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
    },
  });
}

function buildDocument() {
  const children = [];

  // Заголовок
  children.push(
    new Paragraph({
      text: 'Документация API Kvant Server',
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: 'Версия: 1.0', bold: true }),
        new TextRun({ text: '  |  Протокол: HTTPS' }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 600 },
    })
  );

  // Общие сведения
  children.push(
    new Paragraph({
      text: '1. Общие сведения',
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 400, after: 200 },
    }),
    new Paragraph({
      text: 'Базовый URL: https://localhost:3000',
      spacing: { after: 100 },
    }),
    new Paragraph({
      text: 'Формат ответов: { success: true, data } при успехе; { success: false, error } при ошибке. Content-Type: application/json.',
      spacing: { after: 200 },
    }),
    new Paragraph({
      text: 'Авторизация: все эндпоинты кроме /api/auth/* требуют токена (cookie access_token или заголовок Authorization: Bearer <token>).',
      spacing: { after: 400 },
    })
  );

  const methodOrder = ['GET', 'POST', 'PUT', 'DELETE'];
  let moduleNum = 2;

  for (const [key, module] of Object.entries(API_DATA)) {
    children.push(
      new Paragraph({
        text: `${moduleNum}. ${module.name}`,
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 },
      }),
      new Paragraph({
        text: `Базовый путь: ${module.basePath}${module.tokenRequired ? '  •  Токен требуется' : '  •  Токен не требуется'}`,
        spacing: { after: 300 },
      })
    );
    moduleNum++;

    for (const method of methodOrder) {
      const eps = module.endpoints[method];
      if (!eps || eps.length === 0) continue;

      children.push(
        new Paragraph({
          text: `Метод ${method}`,
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 300, after: 150 },
        })
      );
      children.push(createEndpointTable(eps));
      children.push(
        new Paragraph({
          text: '',
          spacing: { after: 200 },
        })
      );
    }
  }

  // Коды ошибок
  children.push(
    new Paragraph({
      text: `${moduleNum}. Коды ошибок`,
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 400, after: 200 },
    })
  );
  const errorRows = [
    new TableRow({
      children: [
        createTableCell('Код', true),
        createTableCell('Описание', true),
      ],
    }),
    new TableRow({ children: [createTableCell('200'), createTableCell('Успех')] }),
    new TableRow({ children: [createTableCell('201'), createTableCell('Создано')] }),
    new TableRow({ children: [createTableCell('400'), createTableCell('Неверный запрос')] }),
    new TableRow({ children: [createTableCell('401'), createTableCell('Не авторизован')] }),
    new TableRow({ children: [createTableCell('403'), createTableCell('Доступ запрещён')] }),
    new TableRow({ children: [createTableCell('404'), createTableCell('Не найдено')] }),
    new TableRow({ children: [createTableCell('409'), createTableCell('Конфликт')] }),
    new TableRow({ children: [createTableCell('500'), createTableCell('Ошибка сервера')] }),
  ];
  children.push(
    new Table({
      width: { size: 50, type: WidthType.PERCENTAGE },
      rows: errorRows,
      borders: {
        top: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
        bottom: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
        left: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
        right: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
        insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
        insideVertical: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
      },
    })
  );

  return new Document({
    sections: [
      {
        properties: {},
        children,
      },
    ],
  });
}

async function main() {
  const doc = buildDocument();
  const outDir = path.join(__dirname, '..', 'files', 'docs');
  const outPath = path.join(outDir, 'API_DOCUMENTATION.docx');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(outPath, buffer);
  console.log('Создан файл:', outPath);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
