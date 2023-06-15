import { Store } from '../store'
import { Task } from './task'

export function TaskList() {
  const tasks = Store.use((store) => store.tasks.flat)

  return (
    <>
      {tasks.map((task) => (
        <Task key={task.id} {...task} />
      ))}
    </>
  )
}
