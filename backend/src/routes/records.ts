import { Router } from 'express';
import * as recordController from '../controllers/recordController';
import { 
  authenticate, 
  requireJournalRead, 
  requireJournalWrite, 
  requireJournalAnalyst,
  requireAdmin 
} from '../middleware/auth';
import { validate, recordSchemas } from '../middleware/validation';

const router = Router();

/**
 * @swagger
 * /api/records:
 *   post:
 *     summary: Создание новой записи в журнале
 *     tags: [Records]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - journalId
 *               - data
 *             properties:
 *               journalId:
 *                 type: string
 *               data:
 *                 type: object
 *     responses:
 *       201:
 *         description: Запись успешно создана
 *       400:
 *         description: Ошибка валидации
 *       403:
 *         description: Недостаточно прав
 */
router.post('/', authenticate, validate(recordSchemas.create), recordController.createRecord);

/**
 * @swagger
 * /api/records/journal/{journalId}:
 *   get:
 *     summary: Получение записей журнала
 *     tags: [Records]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: journalId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: filters
 *         schema:
 *           type: string
 *           description: JSON строка с фильтрами
 *     responses:
 *       200:
 *         description: Список записей
 *       403:
 *         description: Недостаточно прав
 */
router.get('/journal/:journalId', authenticate, requireJournalRead, recordController.getRecords);

/**
 * @swagger
 * /api/records/{recordId}:
 *   get:
 *     summary: Получение записи по ID
 *     tags: [Records]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: recordId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Данные записи
 *       404:
 *         description: Запись не найдена
 */
router.get('/:recordId', authenticate, recordController.getRecordById);

/**
 * @swagger
 * /api/records/{recordId}:
 *   put:
 *     summary: Обновление записи (только для администраторов)
 *     tags: [Records]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: recordId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - data
 *             properties:
 *               data:
 *                 type: object
 *     responses:
 *       200:
 *         description: Запись обновлена
 *       403:
 *         description: Недостаточно прав
 */
router.put('/:recordId', authenticate, requireAdmin, validate(recordSchemas.update), recordController.updateRecord);

/**
 * @swagger
 * /api/records/{recordId}:
 *   delete:
 *     summary: Удаление записи (только для администраторов)
 *     tags: [Records]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: recordId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Запись удалена
 *       403:
 *         description: Недостаточно прав
 */
router.delete('/:recordId', authenticate, requireAdmin, recordController.deleteRecord);

/**
 * @swagger
 * /api/records/export/{journalId}:
 *   get:
 *     summary: Экспорт записей журнала (только для аналитиков и администраторов)
 *     tags: [Records]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: journalId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [xlsx, csv]
 *           default: xlsx
 *       - in: query
 *         name: filters
 *         schema:
 *           type: string
 *           description: JSON строка с фильтрами
 *     responses:
 *       200:
 *         description: Файл экспорта
 *       403:
 *         description: Недостаточно прав
 */
router.get('/export/:journalId', authenticate, requireJournalAnalyst, recordController.exportRecords);

export default router;
