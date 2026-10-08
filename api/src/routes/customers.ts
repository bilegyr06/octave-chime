import { Router } from "express";
import { parseOrThrow } from "../schemas/parse";
import { customerQuerySchema } from "../schemas/query";
import { createCustomerSchema, updateCustomerSchema } from "../schemas/customer";
import {
  createCustomer,
  getCustomer,
  issueCustomerEnrollLink,
  listCustomers,
  updateCustomer,
} from "../services/customers";
import { requireAuth, requireBankAdmin } from "./middleware";

export const customersRouter = Router();

customersRouter.use(requireAuth);
customersRouter.use(requireBankAdmin());

customersRouter.get("/", async (req, res, next) => {
  try {
    const query = parseOrThrow(customerQuerySchema, req.query);
    const result = await listCustomers(req.admin!, {
      page: query.page,
      pageSize: query.pageSize,
      q: query.q,
      serviceStatus: query.serviceStatus,
      enrollmentStatus: query.enrollmentStatus,
      requestedBankId: query.bankId,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

customersRouter.get("/:id", async (req, res, next) => {
  try {
    const detail = await getCustomer(req.admin!, req.params.id);
    res.json(detail);
  } catch (err) {
    next(err);
  }
});

customersRouter.post("/", async (req, res, next) => {
  try {
    const input = parseOrThrow(createCustomerSchema, req.body);
    const customer = await createCustomer(req.admin!, input);
    res.status(201).json(customer);
  } catch (err) {
    next(err);
  }
});

customersRouter.patch("/:id", async (req, res, next) => {
  try {
    const input = parseOrThrow(updateCustomerSchema, req.body);
    const customer = await updateCustomer(req.admin!, req.params.id, input);
    res.json(customer);
  } catch (err) {
    next(err);
  }
});

/** Phase 6 admin invite: mint + return a copyable secure enrollment link. */
customersRouter.post("/:id/enroll-link", async (req, res, next) => {
  try {
    const link = await issueCustomerEnrollLink(req.admin!, req.params.id);
    res.status(201).json(link);
  } catch (err) {
    next(err);
  }
});