const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const statusController = require("../controllers/statusController");
const {multerMiddleware} = require("../config/cloudinaryConfig");


const router = express.Router();

//protected routes
router.post('/', authMiddleware, multerMiddleware, statusController.createStatus);
router.get('/', authMiddleware, statusController.getStatuses);

router.put('/:statusId/view', authMiddleware, statusController.viewStatus);

router.delete('/:statusId', authMiddleware, statusController.deleteStatus);

module.exports = router;