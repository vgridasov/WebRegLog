// Инициализация MongoDB для WebRegLog

// Переключаемся на базу данных приложения
db = db.getSiblingDB('webreglog');

// Создаем первого администратора
db.users.insertOne({
  email: 'admin@webreglog.com',
  password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj5Kbxt9hCBK', // password: admin123
  firstName: 'Администратор',
  lastName: 'Системы',
  role: 'admin',
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date()
});

// Создаем индексы для улучшения производительности
db.users.createIndex({ email: 1 }, { unique: true });
db.journals.createIndex({ uniqueId: 1 }, { unique: true });
db.journals.createIndex({ createdBy: 1 });
db.journals.createIndex({ 'access.userId': 1 });
db.records.createIndex({ journalId: 1 });
db.records.createIndex({ createdBy: 1 });
db.records.createIndex({ createdAt: -1 });
db.records.createIndex({ journalId: 1, createdAt: -1 });

// Создаем демонстрационный журнал
const adminUser = db.users.findOne({ email: 'admin@webreglog.com' });

if (adminUser) {
  const demoJournal = {
    name: 'Журнал инцидентов',
    description: 'Демонстрационный журнал для регистрации инцидентов информационной безопасности',
    uniqueId: 'incidents-demo',
    fields: [
      {
        id: 'incidentDate',
        type: 'date',
        label: 'Дата инцидента',
        required: true,
        order: 1
      },
      {
        id: 'incidentType',
        type: 'select',
        label: 'Тип инцидента',
        required: true,
        options: [
          'Нарушение доступа',
          'Утечка данных',
          'Вредоносное ПО',
          'Социальная инженерия',
          'DDoS атака',
          'Другое'
        ],
        order: 2
      },
      {
        id: 'description',
        type: 'text',
        label: 'Описание инцидента',
        placeholder: 'Подробное описание произошедшего',
        required: true,
        order: 3
      },
      {
        id: 'severity',
        type: 'radio',
        label: 'Критичность',
        required: true,
        options: ['Низкая', 'Средняя', 'Высокая', 'Критическая'],
        order: 4
      },
      {
        id: 'affectedSystems',
        type: 'text',
        label: 'Затронутые системы',
        placeholder: 'Перечислите затронутые системы',
        required: false,
        order: 5
      },
      {
        id: 'resolved',
        type: 'checkbox',
        label: 'Инцидент устранен',
        required: false,
        order: 6
      }
    ],
    access: [],
    createdBy: adminUser._id,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  db.journals.insertOne(demoJournal);
  
  console.log('✅ Демонстрационный журнал создан');
}

// Создаем демонстрационных пользователей
const demoUsers = [
  {
    email: 'registrar@webreglog.com',
    password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj5Kbxt9hCBK', // password: registrar123
    firstName: 'Иван',
    lastName: 'Регистратор',
    role: 'registrar',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    email: 'analyst@webreglog.com', 
    password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj5Kbxt9hCBK', // password: analyst123
    firstName: 'Анна',
    lastName: 'Аналитик',
    role: 'analyst',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

db.users.insertMany(demoUsers);

console.log('✅ База данных WebRegLog инициализирована');
console.log('👤 Администратор: admin@webreglog.com / admin123');
console.log('👤 Регистратор: registrar@webreglog.com / registrar123');
console.log('👤 Аналитик: analyst@webreglog.com / analyst123');
