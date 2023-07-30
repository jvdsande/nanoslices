import { Button, Group, TextInput } from '@mantine/core'
import { Store } from '../store'

export const NewTask = () => {
  const [value, valid] = Store.use((store) => [store.newTask.value, store.newTask.valid])
  const [onChange, submit] = Store.act((store) => [store.newTask.setValue, store.newTask.submit])

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        submit()
      }}
    >
      <Group>
        <TextInput
          style={{ flex: 1 }}
          radius="md"
          variant="filled"
          placeholder="New task"
          value={value}
          onChange={(e) => onChange(e.currentTarget.value)}
        />
        <Button radius="md" type="submit" disabled={!valid}>
          Add
        </Button>
      </Group>
    </form>
  )
}
