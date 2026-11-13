// Persistence layer abstraction. ApplicationService depends on this, not on Supabase,
// so the database can change without touching business logic (Dependency Inversion).
export class ApplicationRepository {
  // Resolves to the logged-in student's applications (Application[]), newest first.
  async findAll() {
    throw new Error('findAll() not implemented')
  }

  // Resolves to an Application, or null when the student can't see one with this id.
  async findById(_id) {
    throw new Error('findById() not implemented')
  }

  // Saves a new status and resolves to the updated Application, or null when not found.
  async updateStatus(_id, _status) {
    throw new Error('updateStatus() not implemented')
  }
}
