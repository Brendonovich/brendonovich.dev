---
draft: true
title: "The Ultimate Form Abstraction"
byline: "Forms are often tricky to get right when working with React, but do they have to be?"
date: 29 Dec 2022
---

I often see this question pop up online:

> "what's the best way to do forms in a react app?"

Some people may recommended [Formik](https://formik.io),
others may just use a `<form>` element's `onSubmit` function directly,
but in my experience, the answer is always...

[React Hook Form](https://react-hook-form.com/).
Hands down.

## The Basics

RHF is a library that provides hook-based utilities for managing form state and inputs,
and is very performant as it keeps components uncontrolled until they need to be validated.
A basic usage of it looks something like this:

```tsx
import { useForm } from "react-hook-form"

export function App() {
  const { register, handleSubmit } = useForm();

  return (
    <form onSubmit={handleSubmit((data) => {})}>
      <input
        type="email"
        {...register("email", {
          required: true
        })}
      />
      <button type="submit">Submit</button>
    </form>
  )
}
```

Let's step through this code a bit:

`useForm` provides all the utilities you'll need to create a form.
It keeps track of all the form elements, their validation logic,
and just general housekeeping stuff for the library.

`register` hooks up a form element to the data being managed in `useForm`,
and is where you configure settings for each field - most notably validation logic.

`handleSubmit` takes the validation rules you provide to `register`, applies them to the form data, and provides the validated values to the callback in its first argument.

```tsx
const { register, handleSubmit } = useForm();
```

Instead of passing our `onSubmit` handler directly,
we wrap it in `handleSubmit` so that validation and other logic can be performed.

```tsx
<form onSubmit={handleSubmit(onSubmit)}>
```

`register` returns props for the element it is being applied to,
including `ref`, `value` and `onChange`
(the `ref` is how RHF allows components to be uncontrolled until validation!),
so we spread its return value onto the `<input/>` element.

```tsx
<input
  type="email"
  {...register("email", {
    required: true
  })}
/>
```

## Levelling Up With TypeScript

Having something to handle forms is nice,
but wouldn't it be great to know the shape of our form data?

Well, we can!

`useForm` has a generic parameter that can specify the type of our form data,
allowing TypeScript to verify that the names used in `register` are vaild:

```tsx
interface FormTypes {
  email: string;
  count: number;
}

export function App() {
  const { register, handleSubmit } = useForm<FormTypes>();

  return (
    <form onSubmit={handleSubmit((data) => {})}>
      <input
        type="email"
        {...register("email", {
          required: true
        })}
      />
      <input
        type="number"
        {...register("count", {
          required: true,
          valueAsNumber: true
        })}
      />
      <button type="submit">Submit</button>
    </form>
  )
}
```

Now we can be 100% sure about the names of our fields!

Only problem is that we're not 100% sure about our fields' types.
The `valueAsNumber` option on the `count` input tells RHF to convert the field's `value` - which is always a `string` - into a number.
If `valueAsNumber` was `false`,
TypeScript wouldn't complain but our `FormTypes` would not be accurrate.

If only there was a way to validate types...


## That One Library Everyone's Using

Enter [Zod](https://github.com/colinhacks/zod),
a validation library with incredible TypeScript support that T3 stack enjoyers talk about endlessly.

RHF supports validating forms with Zod via [resolvers](https://github.com/react-hook-form/resolvers#zod),
providing incredible typesafety in the process.

Using Zod will require installing `zod` and `@hookform/resolvers`,
then making a few changes to the above example:

```tsx
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

export function App() {
  const { register, handleSubmit } = useForm({
    resolver: zodResolver(z.object({
      email: z.string(),
      count: z.coerce.number()
    }))
  });

  return (
    <form onSubmit={handleSubmit((data) => {})}>
      <input
        type="email"
        {...register("email")}
      />
      <input
        type="number"
        {...register("count")}
      />
      <button type="submit">Submit</button>
    </form>
  )
}
```

Isn't it great!
Fields no longer have to be marked as `required` since `schema` controls whether they are optional or not,
and `z.coerce.number()` provides a typesafe alternative to `valueAsNumber`.

There's a problem though:

**It's not actually typesafe.**

I know, I was surprised too.
Turns out resolvers can't set the generic we need.
Not to worry, we've got more work to do anyway.

## A Typesafe Coincidence

If you're anything like me you'll see `resolver: zodResolver(schema)` and cringe.
Apps can have many forms, meaning that line may be repeated a _lot_.
Sounds like a great use for a **custom hook**!

Instead of wrapping `schema` in `zodResolver`,
it'd be great to pass `schema` directly to our hook.
The hook will also need a generic parameter for the schema to ensure that everything is typesafe.

With all that in mind, here's a hook:

```tsx
import { useForm, UseFormProps } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { TypeOf, ZodSchema } from 'zod';

interface UseZodFormProps<Z extends ZodSchema>
  extends Exclude<UseFormProps<TypeOf<Z>>, 'resolver'> {
  schema: Z;
}

export const useZodForm = <Z extends ZodSchema>({
  schema,
  ...formProps
}: UseZodFormProps<Z>) =>
  useForm({
    ...formProps,
    resolver: zodResolver(schema),
  });
```

Don't be scared by the heap of generics on `UseZodFormProps`,
they just pass the schema's type to the base `UseFormProps` type and remove the `resolver` field,
and by coincidence this makes our form completely typesafe! 

Assuming `useZodForm` is imported,
here's how things should look now:

```tsx
export function App() {
  const { register, handleSubmit } = useZodForm({ 
    schema: z.object({
      email: z.string(),
      count: z.coerce.number()
    })
  });

  return (
    <form onSubmit={handleSubmit((data /* has types now! */) => {})}>
      <input
        type="email"
        {...register("email")}
      />
      <input
        type="number"
        {...register("count")}
      />
      <button type="submit">Submit</button>
    </form>
  )
}

```

Here's a look at everything we've done so far:

<iframe
  src="https://stackblitz.com/edit/vitejs-vite-sntab3?embed=1&file=src/App.tsx&theme=dark&view=editor&ctl=1"
  class="w-full h-500px border-sm overflow-hidden"
  loading="lazy"
  title="Stackblitz Demo for Part 1"
></iframe>

> Sidenote: 
I think demos like this are a good example of what TypeScript's developer experience should be -
generics behind the scenes propagating input types from inside `react-hook-form` all the way out to our application code.
Libraries like [tRPC](https://trpc.io) and [TanStack Query/Router](https://tanstack.com/) manage to do a similar thing.

