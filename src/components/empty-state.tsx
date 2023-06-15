import { Text } from '@mantine/core'
import { Store } from '../store'

export function EmptyState() {
  const tasks = Store.use((store) => store.tasks.flat)

  if (tasks.length) return null

  return (
    <Text color="dimmed" ta="center">
      No task yet
    </Text>
  )
}
