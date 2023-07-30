import { memo } from 'react'
import { Checkbox, CloseButton, Group, Text, TextInput } from '@mantine/core'
import { Store } from '../store'

export const Task = memo((props: { taskId: string }) => {
  const task = Store.use((store) => store.tasks.tasks, { keys: [props.taskId] })[props.taskId]
  const [renameTask, toggleTask, deleteTask] = Store.act((store) => [
    store.tasks.renameTask,
    store.tasks.toggleTask,
    store.tasks.deleteTask
  ])

  if (!task)
    return null

  return (
    <Group
      h={48}
      p={8}
      pt={0}
      mt={-8}
      style={{ borderBottom: '1px solid #0001' }}>
      {!task.done && (
        <TextInput
          style={{ flex: 1 }}
          variant="unstyled"
          value={task.name}
          onChange={(e) => {
            renameTask(props.taskId, e.currentTarget.value)
          }}
        />
      )}
      {task.done && (
        <Text
          style={{ flex: 1 }}
          mt={1}
          px={2}
          strikethrough
          size="sm"
          color="dimmed">
          {task.name}
        </Text>
      )}
      <Checkbox
        checked={task.done}
        onChange={() => toggleTask(props.taskId)}
      />
      <CloseButton
        color="red"
        sx={{ color: 'gray', '&:hover': { color: 'red' } }}
        onClick={() => deleteTask(props.taskId)}
      />
    </Group>
  )
})
