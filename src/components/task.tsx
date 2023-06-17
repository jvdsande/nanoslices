import { Checkbox, CloseButton, Group, Text, TextInput } from '@mantine/core'
import { Store } from '../store'

export function Task(props: { id: number; name: string; done?: boolean }) {
  return (
    <Group
      h={48}
      p={8}
      pt={0}
      mt={-8}
      style={{ borderBottom: '1px solid #0001' }}
    >
      {!props.done && (
        <TextInput
          style={{ flex: 1 }}
          variant="unstyled"
          value={props.name}
          onChange={(e) => {
            Store.act((store) =>
              store.tasks.renameTask(props.id, e.currentTarget.value),
            )
          }}
        />
      )}
      {props.done && (
        <Text
          style={{ flex: 1 }}
          mt={1}
          px={2}
          strikethrough
          size="sm"
          color="dimmed"
        >
          {props.name}
        </Text>
      )}
      <Checkbox
        checked={props.done}
        onChange={() => Store.act((store) => store.tasks.toggleTask(props.id))}
      />
      <CloseButton
        color="red"
        sx={{ color: 'gray', '&:hover': { color: 'red' } }}
        onClick={() => Store.act((store) => store.tasks.deleteTask(props.id))}
      />
    </Group>
  )
}
