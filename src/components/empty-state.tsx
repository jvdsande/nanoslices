import { Text } from '@mantine/core'
import { Store } from '../store'

export function EmptyState() {
  const empty = Store.use((store) => store.tasks.empty)

  if (!empty) return null

  return (
    <Text color="dimmed" ta="center">
      No task yet
    </Text>
  )
}
