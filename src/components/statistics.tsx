import { Badge, Text, Group } from '@mantine/core'
import { Store } from '../store'

export function Statistics() {
  const total = Store.use((store) => store.statistics.total)
  const done = Store.use((store) => store.statistics.done)
  const progress = Store.use((store) => store.statistics.progress)

  return (
    <Group mt={14} w="100%" position="right" align="center" spacing={8}>
      <Badge variant="dot" size="lg">
        <Group align="center" spacing={4}>
          <Text lh={1} size={9}>
            Total
          </Text>
          <Text lh={1}>{total}</Text>
        </Group>
      </Badge>
      <Badge variant="dot" size="lg" color="teal">
        <Group align="center" spacing={4}>
          <Text lh={1} size={9}>
            Done
          </Text>
          <Text lh={1}>{done}</Text>
        </Group>
      </Badge>
      <Text lh={1} weight="bold" color="dimmed" size={10}>
        {progress.toFixed(2)}%
      </Text>
    </Group>
  )
}
