import { Store } from '../store'
import { Task } from './task'

export const TaskList = () => {
  const tasks = Store.use((store) => store.tasks.keys)

  return (
    <>
      {tasks.map((task) => (
        <Task key={task} taskId={task} />
      ))}
    </>
  )
}
