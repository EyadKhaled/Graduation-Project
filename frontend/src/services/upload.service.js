import { api } from "./api.js";

const MAX_FILE_SIZE_MB = 20;

export const uploadService = {
  // POST /uploads/  (multipart/form-data)
  upload: (file) => {
    const sizeMB = file.size / (1024 * 1024);
    if (sizeMB > MAX_FILE_SIZE_MB) {
      throw { message: `File exceeds ${MAX_FILE_SIZE_MB}MB limit.`, status: 400 };
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("file_name", file.name);
    formData.append("file_type", file.type);

    return api.post("/uploads/", formData);
  },

  // GET /uploads/
  getHistory: () => api.get("/uploads/"),

  // DELETE /uploads/:id/
  delete: (id) => api.delete(`/uploads/${id}/`),
};
