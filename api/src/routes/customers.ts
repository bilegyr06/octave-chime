import { Router } from "express";
import { parseOrThrow } from "../schemas/parse";
import { customerQuerySchema } from "../schemas/query";
import { updateCustomerSchema } from "../schemas/customer";
import { getCustomer, listCustomers, updateCustomer } from "../services/customers";
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

customersRouter.patch("/:id", async (req, res, next) => {
  try {
    const input = parseOrThrow(updateCustomerSchema, req.body);
    const customer = await updateCustomer(req.admin!, req.params.id, input);
    res.json(customer);
  } catch (err) {
    next(err);
  }
});