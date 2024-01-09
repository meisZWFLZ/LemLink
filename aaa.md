# Device Sharing

- I think it should be a key feature of LemLink
- tasks are something that requires access to the v5 serial connection
- types of tasks
  - interrupt-able: tasks that can be automatically interrupted with no consequences
    - eg: terminal connection
    - maybe, a concept of lazy interrupt-able tasks, that before they can stop, must perform some action
    - perhaps, a revive flag to revive a task after it has been interrupted and the device's connection has been freed up
    - should there be a heartbeat to check that a long running task is still active?
  - non-interrupt-able: tasks that should not be interrupted unless requested by the user
  - eg: program upload, file download (screen capture), maybe brain commands
    > [!NOTE]
    > the task queue does not include the task that is currently consuming the connection
- operations:
  - enqueue: adds a task to the queue
    - if there is no task currently connected, this task will be connected
    - if the currently connected task is an interrupt-able task, the connection manager will attempt to interrupt said task
    - if the new task is non-interrupt-able, it will skip any interrupt-able tasks in the queue
    - What happens if theres multiple interrupt-able tasks in the queue?
    - bypass flag: adds a task to the front of the queue
    - returns a task id
  - clear: clears all currently enqueued tasks
  - remove: removes a task specified by its id
    > [!NOTE]
    > Doesn't remove the task currently connected to the device
  - disconnect: removes the currently connected task
    - should only be run with explicit permission from user
    - force flag: ignores any pre-interrupt actions
  - getters:
    - queue length
    - is a task currently connected
    - properties of currently connected task
    - properties of n-indexed task
- what is a task?
  - can read from the serial connection
  - can write to the serial connection
  - can be interrupt-able
  - has an onConnected() event
  - can have a pre interrupt event()
  - can disconnect itself from the connection (freeing up the connection for the next task in the queue)
