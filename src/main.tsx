import { createRoot } from 'react-dom/client'
import { Card, Stack, Title, Global } from '@mantine/core'

import { NewTask } from './components/new-task'
import { EmptyState } from './components/empty-state'
import { TaskList } from './components/task-list'
import { Statistics } from './components/statistics'

export function App() {
  return (
    <>
      <Global styles={{ body: { background: '#FAFAFA' } }} />
      <Title size="h2" mx="auto" w="fit-content" mt="10%" mb={16}>
        Nanoslices Tasklist
      </Title>
      <Card withBorder m="auto" w={480}>
        <NewTask />

        <Stack mt={24} mb={8}>
          <EmptyState />
          <TaskList />
        </Stack>

        <Statistics />
      </Card>
    </>
  )
}

const root = createRoot(document.getElementById('root') as HTMLElement)
root.render(<App />)
