import express from "express";
import {
  createInvoice,
  getAllInvoices,
  getInvoiceById,
  updateInvoiceById,
  deleteInvoiceById,
  getNextInvoiceNumber,
  getBillToList,
  searchInvoicesByIdentifier,
  getInvoiceSummaryByCompanyId
} from "../controllers/invoices.js";
import auth from '../middlewares/authMiddleware.js';

const router = express.Router();

// Core Invoice Operations
router.post("/add", auth, createInvoice);
router.get("/get", auth, getAllInvoices);
router.get("/getbyId/:id", auth, getInvoiceById);
router.put("/updateById/:id", auth, updateInvoiceById);
router.delete("/delete/:id", auth, deleteInvoiceById);

// Invoice Number Generation
router.get("/nextInvoiceNumber", auth, getNextInvoiceNumber);

// Search and Filter Operations
router.get("/bill-to", auth, getBillToList);
router.get("/invoices/:identifier", auth, searchInvoicesByIdentifier);
router.get('/summary/:companyId', auth, getInvoiceSummaryByCompanyId);

export default router;
