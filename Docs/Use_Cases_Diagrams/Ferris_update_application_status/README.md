1. Use Case Diagram
Shows how the student interacts with the application status functionality.

<img width="735" height="485" alt="use case diagram" src="https://github.com/user-attachments/assets/f43af322-eaaf-49b3-b42a-dee6b38bb7cc" />

Main components:
- Actor: Student
- View Applications
- Select Application
- Update Application Status
- Save Status Changes
- View Updated Status
2. Activity Diagram
Shows the sequence of actions when a student updates an application.

<img width="974" height="650" alt="activity diagram" src="https://github.com/user-attachments/assets/624378e9-4805-49db-a3c0-16daa521a243" />

Flow:
1. Student opens Applications.
2. Student selects an application.
3. Student chooses a new status.
4. System validates the selection.
5. System saves the updated status.
6. Updated status is displayed.
If the update fails, the system displays an error message.
3. Sequence Diagram
Shows how the frontend, backend, and database communicate.

<img width="1136" height="539" alt="Sequence diagram" src="https://github.com/user-attachments/assets/51a72b68-cee0-4163-94b0-71d9e20523b4" />

Objects:
- Student
- Application Dashboard (Frontend)
- Application Controller (Backend)
- Application Database
Interactions:
1. Student selects a new status.
2. Frontend sends an update request.
3. Backend processes the request.
4. Database updates the application record.
5. Backend returns confirmation.
6. Frontend displays the new status.
4. Class Diagram
Shows the main classes and relationships involved in updating an application.

<img width="690" height="450" alt="Class diagram" src="https://github.com/user-attachments/assets/1e96c2cf-36a1-45b6-bc37-da013ed53db5" />

Suggested classes:
Class	Attributes / Methods
Student	studentId, name
Application	applicationId, companyName, position, status
ApplicationStatus	Applied, Interviewing, Offer, Rejected
ApplicationController	updateStatus(), getApplications()

The Application class stores the current status, while ApplicationController handles status updates.

Summary of the four diagrams
Diagram	Purpose
Use Case	Shows what the student can do
Activity	Shows the workflow
Sequence	Shows frontend/backend communication
Class	Shows the software structure
