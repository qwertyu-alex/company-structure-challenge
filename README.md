![Video 1 (1)](https://github.com/thebestclicker/company-structure-challenge/assets/10188306/ea67a93a-1963-49e0-b8ef-50819bc841ac)

<p align="center">
  <br/>
  <p >Company Structure</p> 
  <br/>
</p>

## About

This is a project created to solve a Full Stack Code Challenge.

## How to run

Requirements:

- Either `npm` or `pnpm` installed

Run the following commands to run on dev:

```sh
pnpm install
pnpm dev
```

Run the following commands to run in production:

```sh
pnpm install
pnpm build
pnpm start
```

Go to [http://localhost:3000](http://localhost:3000) for webapp.
Go to [http://localhost:3000/api/panel](http://localhost:3000/api/panel) for api panel (swagger like).

## Create T3 App

This is a [T3 Stack](https://create.t3.gg/) project bootstrapped with `create-t3-app`.

## Notes

Endpoints:

- [ ] Add a new node to the tree
- [ ] Get all child nodes of a given node from the tree
- [ ] Change the parent node of a given node

Frontend:

- [ ] Setting the active structure
- [ ] Visualizing the active structure
- [ ] Add a new node
- [ ] (Change the parent node)

```tsx
type Node = {
	id: string,
	name: string,
	parent: string,
	children: Set<string>,
	height: number,
}

type Manager extends Node = {
	managingDepartment: string,
}

type Developer extends Node = {
	preferredProgrammingLanguage: string
}
```

### Assumptions

If root-node is the only node in the tree, it is both a manager and a developer

Managers are nodes with any number of child larger than 0.

Developers are nodes with no children.

### Cases

- When a developer receives a child, then the developer should be promoted to manager
- When all children for a manager have moved away by changing the parent of each node, then that manager should be demoted to a developer

### Technology

- React for the front
- Next JS for the backend
- tRPC for tying backend and frontend together
- Shadcn as component library
- SQL lite with Prisma for data persistence
- Tailwind for styling
- Maybe: Jotai for state management for the nodes

### Things to implement to show off

- React flow
