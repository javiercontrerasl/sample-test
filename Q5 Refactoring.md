### Q5. Refactoring
- In the Q3, an user should not reserver and/or unreserve events in the past. The test API should check that logic.
- Changes in the 'create.sql' file. It does not have any relacionship with any table. no foreign keys as well as composite keys are not a good idea. Never forget  ACID (Atomicity, Consistency, Isolation, Durability) rule!
- Be careful about with data code respond we are sending back. 500 error code for a unauthorized access is madness. If we have to give a diagnostic of the services with only that information. we have to debug it to understand the error or check the log if we implement it. I have changed some error in the test.
- Implement a logger system.