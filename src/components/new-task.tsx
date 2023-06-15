import { Button, Group, TextInput } from '@mantine/core'
import { Store } from '../store'

export function NewTask() {
  const value = Store.use((store) => store.nested.newTask.value)
  const valid = Store.use((store) => store.nested.newTask.valid)
  const onChange = Store.act((store) => store.nested.newTask.setValue)
  const submit = Store.act((store) => store.nested.newTask.submit)

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
          placeholder="New task"
          value={value}
          onChange={(e) => onChange(e.currentTarget.value)}
        />
        <Button type="submit" disabled={!valid}>
          Add
        </Button>
      </Group>
    </form>
  )
}
