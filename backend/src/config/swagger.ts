import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'WebRegLog API',
      version: '1.0.0',
      description: 'API для универсального веб-приложения журналов регистрации',
      contact: {
        name: 'API Support',
        email: 'support@webreglog.com'
      }
    },
    servers: [
      {
        url: process.env.NODE_ENV === 'production' 
          ? 'https://api.webreglog.com' 
          : `http://localhost:${process.env.PORT || 5000}`,
        description: process.env.NODE_ENV === 'production' ? 'Production server' : 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Уникальный идентификатор пользователя'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Email пользователя'
            },
            firstName: {
              type: 'string',
              description: 'Имя пользователя'
            },
            lastName: {
              type: 'string',
              description: 'Фамилия пользователя'
            },
            role: {
              type: 'string',
              enum: ['admin', 'registrar', 'analyst'],
              description: 'Роль пользователя'
            },
            isActive: {
              type: 'boolean',
              description: 'Активен ли пользователь'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Дата создания'
            }
          }
        },
        Journal: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Уникальный идентификатор журнала'
            },
            name: {
              type: 'string',
              description: 'Название журнала'
            },
            description: {
              type: 'string',
              description: 'Описание журнала'
            },
            uniqueId: {
              type: 'string',
              description: 'Уникальный идентификатор журнала'
            },
            fields: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/FieldDefinition'
              },
              description: 'Структура полей журнала'
            },
            access: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/JournalAccess'
              },
              description: 'Настройки доступа к журналу'
            },
            recordCount: {
              type: 'number',
              description: 'Количество записей в журнале'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Дата создания'
            }
          }
        },
        FieldDefinition: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Идентификатор поля'
            },
            type: {
              type: 'string',
              enum: ['text', 'number', 'date', 'select', 'checkbox', 'radio', 'file'],
              description: 'Тип поля'
            },
            label: {
              type: 'string',
              description: 'Название поля'
            },
            placeholder: {
              type: 'string',
              description: 'Подсказка для поля'
            },
            required: {
              type: 'boolean',
              description: 'Обязательность поля'
            },
            options: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'Варианты выбора для select и radio'
            },
            order: {
              type: 'number',
              description: 'Порядок отображения поля'
            }
          }
        },
        JournalAccess: {
          type: 'object',
          properties: {
            userId: {
              type: 'string',
              description: 'ID пользователя'
            },
            role: {
              type: 'string',
              enum: ['registrar', 'analyst'],
              description: 'Роль пользователя в журнале'
            }
          }
        },
        Record: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Уникальный идентификатор записи'
            },
            journalId: {
              type: 'string',
              description: 'ID журнала'
            },
            data: {
              type: 'object',
              description: 'Данные записи (динамическая структура)'
            },
            createdBy: {
              $ref: '#/components/schemas/User',
              description: 'Пользователь, создавший запись'
            },
            updatedBy: {
              $ref: '#/components/schemas/User',
              description: 'Пользователь, обновивший запись'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Дата создания'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Дата обновления'
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              description: 'Сообщение об ошибке'
            },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: {
                    type: 'string'
                  },
                  message: {
                    type: 'string'
                  }
                }
              },
              description: 'Детали ошибок валидации'
            }
          }
        }
      }
    }
  },
  apis: ['./src/routes/*.ts'] // путь к файлам с аннотациями
};

const specs = swaggerJsdoc(options);

export const setupSwagger = (app: Express): void => {
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(specs, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'WebRegLog API Documentation'
  }));

  // JSON endpoint для спецификации
  app.get('/api/docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(specs);
  });

  console.log('📚 Swagger UI доступен по адресу: /api/docs');
};
