import { Router } from 'express';
import * as journalController from '../controllers/journalController';
import { authenticate, requireAdmin } from '../middleware/auth';
import { validate, journalSchemas } from '../middleware/validation';

const router = Router();

/**
 * @swagger
 * /api/journals:
 *   post:
 *     summary: Создание нового журнала (только для администраторов)
 *     tags: [Journals]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - uniqueId
 *               - fields
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               uniqueId:
 *                 type: string
 *               fields:
 *                 type: array
 *                 items:
 *                   type: object
 *               access:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       201:
 *         description: Журнал успешно создан
 *       403:
 *         description: Недостаточно прав
 */
router.post('/', authenticate, requireAdmin, validate(journalSchemas.create), journalController.createJournal);

/**
 * @swagger
 * /api/journals:
 *   get:
 *     summary: Получение списка доступных журналов
 *     tags: [Journals]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Список журналов
 *       401:
 *         description: Не авторизован
 */
router.get('/', authenticate, journalController.getJournals);

/**
 * @swagger
 * /api/journals/{journalId}:
 *   get:
 *     summary: Получение журнала по ID
 *     tags: [Journals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: journalId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Данные журнала
 *       404:
 *         description: Журнал не найден
 */
router.get('/:journalId', authenticate, journalController.getJournalById);

/**
 * @swagger
 * /api/journals/{journalId}:
 *   put:
 *     summary: Обновление журнала (только для администраторов)
 *     tags: [Journals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: journalId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               fields:
 *                 type: array
 *               access:
 *                 type: array
 *     responses:
 *       200:
 *         description: Журнал обновлен
 *       403:
 *         description: Недостаточно прав
 */
router.put('/:journalId', authenticate, requireAdmin, validate(journalSchemas.update), journalController.updateJournal);

/**
 * @swagger
 * /api/journals/{journalId}:
 *   delete:
 *     summary: Удаление журнала (только для администраторов)
 *     tags: [Journals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: journalId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Журнал удален
 *       403:
 *         description: Недостаточно прав
 */
router.delete('/:journalId', authenticate, requireAdmin, journalController.deleteJournal);

/**
 * @swagger
 * /api/journals/users/available:
 *   get:
 *     summary: Получение списка доступных пользователей для назначения доступа
 *     tags: [Journals]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Список пользователей
 */
router.get('/users/available', authenticate, requireAdmin, journalController.getAvailableUsers);

export default router;
