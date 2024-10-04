import { Express } from "express";

export type Controller = (express: Express) => void;
