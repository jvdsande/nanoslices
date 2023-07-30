import { Fragment } from 'react'
import { createRoot } from 'react-dom/client'
import { Card, Stack, Title, Global, Button, Text, Group } from '@mantine/core'

import { atom } from 'nanostores'
import { update } from '@nanoslices/core'
import { useLocalStore } from '@nanoslices/react'
import { useMappedLoader, useMutationLoader, useSingleLoader } from '@nanoslices/resource-loader'

import { NewTask } from './components/new-task'
import { EmptyState } from './components/empty-state'
import { TaskList } from './components/task-list'
import { Statistics } from './components/statistics'

import { Store } from './store'

const Listener = () => {
  useSingleLoader(Store, (s) => s.loaders.single)
  useMappedLoader(Store, (s) => s.loaders.mapped, {
    resource: 'id',
    params: { param: 42 }
  })
  return null
}

const Mutation = () => {
  const state = useLocalStore((slice) =>
    slice
      .state(() => ({ show: atom(false) }))
      .actions(({ slice }) => ({ setShow: update(slice.show) })),
  )
  const [show] = state.use((s) => [s.show])
  const [setShow] = state.act((s) => [s.setShow])

  const [single] = useSingleLoader(Store, (s) => s.loaders.single, { listen: false })
  const [mapped] = useMappedLoader(Store, (s) => s.loaders.mapped, { listen: false, resource: 'id' })
  const [mutation, execute] = useMutationLoader(Store, (s) => s.loaders.mutation)

  return (
    <Fragment>
      {show && <Listener />}
      <Text>Single value</Text>
      <pre>{JSON.stringify(single, null, 2)}</pre>

      <Text>Mapped value</Text>
      <pre>{JSON.stringify(mapped, null, 2)}</pre>

      <Text>Mutation result</Text>
      <pre>{JSON.stringify(mutation, null, 2)}</pre>

      <Group>
        <Button onClick={() => setShow(!show)}>
          {show ? 'Unlisten' : 'Listen'}
        </Button>
        <Button onClick={() => execute()}>
          Execute Mutation
        </Button>
      </Group>
    </Fragment>
  )
}

export const App = () => {
  return (
    <>
      <Global styles={{ body: { background: '#FAFAFA' } }} />
      <Title size="h2" ta="center" mx="auto" w="fit-content" mt="10vh" mb={16}>
        Nanoslices Tasklist
      </Title>
      <Card radius="lg" p="lg" m="auto" w="95vw" maw={480}>
        <NewTask />

        <Stack mt={24} mb={8}>
          <EmptyState />
          <TaskList />
        </Stack>

        <Statistics />
      </Card>

      <Title size="h2" ta="center" mx="auto" w="fit-content" mt={64} mb={16}>
        Nanoslices ResourceLoader
      </Title>

      <Card radius="lg" p="lg" m="auto" w="95vw" maw={480}>
        <Mutation />
      </Card>
    </>
  )
}

const root = createRoot(document.getElementById('root') as HTMLElement)
root.render(<App />)
