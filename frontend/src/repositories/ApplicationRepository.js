// Persistence layer abstraction. ApplicationService depends on this, not on Supabase,
// so the database can change without touching business logic (Dependency Inversion).
export class ApplicationRepository {
  // Resolves to the newly saved Application.
  async create(_application) {
    throw new Error('create() not implemented')
  }

  // Resolves to the logged-in student's applications (Application[]), newest first.
  async findAll() {
    throw new Error('findAll() not implemented')
  }

  // Resolves to an Application, or null when the student can't see one with this id.
  async findById(_id) {
    throw new Error('findById() not implemented')
  }

  // Saves new notes and resolves to the updated Application, or null when not found.
  async updateNotes(_id, _notes) {
    throw new Error('updateNotes() not implemented')
  }

  // Saves a new status and resolves to the updated Application, or null when not found.
  async updateStatus(_id, _status) {
    throw new Error('updateStatus() not implemented')
  }

  // Saves company, position, and deadline; resolves to the updated Application, or null when not found.
  async updateDetails(_id, _details) {
    throw new Error('updateDetails() not implemented')
  }

  // Deletes one application. Resolves to true if it was deleted, false if the student
  // has no application with this id.
  async delete(_id) {
    throw new Error('delete() not implemented')
  }
}
