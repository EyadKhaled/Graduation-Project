import { api } from "./api.js";

export const medicalService = {
  // POST /medical/history/
  save: (formData) =>
    api.post("/medical/history/", {
      first_name: formData.fname,
      last_name: formData.lname,
      date_of_birth: formData.dob,
      gender: formData.gender,
      phone: formData.phone,
      email: formData.email,
      symptoms: formData.symptoms,
    }),

  // GET /medical/history/
  getAll: () => api.get("/medical/history/"),

  // GET /medical/history/:id/
  getById: (id) => api.get(`/medical/history/${id}/`),
};
