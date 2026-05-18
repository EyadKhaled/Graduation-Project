import { api } from "./api.js";

export const helpdeskService = {
  // POST /helpdesk/contact/
  send: ({ email, topic }) =>
    api.post("/helpdesk/contact/", { email, topic }),
};
