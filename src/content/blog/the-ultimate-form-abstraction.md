---
draft: false
title: "The Ultimate Form Abstraction"
byline: "Typesafe forms in React? Sounds like a job for React Hook Form and Zod!"
date: 31 Dec 2022
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
import { useForm } from 'react-hook-form'

const App = () => {
  const { register, handleSubmit } = useForm();

  return (
    <form onSubmit={handleSubmit((data) => {})}>
      <input
        type="email"
        required
        {...register('email')}
      />
      <button type="submit">Submit</button>
    </form>
  )
}

export default App;
```

Let's step through this code a bit:

```tsx
const { register, handleSubmit } = useForm();
```

`useForm` provides all the utilities you'll need to create a form.
It keeps track of all the form elements, their validation logic,
and just general housekeeping stuff for the library.

`register` hooks up a form element to the data being managed in `useForm`,
and is where you configure settings for each field - most notably the input's `name` prop and validation logic.

`handleSubmit` takes the validation rules you provide to `register`, applies them to the form data, and provides the validated values to the callback in its first argument.

```tsx
<form onSubmit={handleSubmit((data) => {})}>
```

Instead of passing our `onSubmit` handler directly,
we wrap it in `handleSubmit` so that validation and other logic can be performed.

```tsx
<input
  type="email"
  required
  {...register('email')}
/>
```

`register` returns props for the element it is being applied to,
including `ref`, `name`, and `onChange`
(the `ref` is how RHF allows components to be uncontrolled until validation!),
so we spread its return value onto the `<input/>` element.
`required` makes the browser enforce that the input is not empty when the form is submitted.

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

const App = () => {
  const { register, handleSubmit } = useForm<FormTypes>();

  return (
    <form onSubmit={handleSubmit((data) => {})}>
      <input
        type="email"
        required
        {...register('email')}
      />
      <input
        type="number"
        required
        {...register('count', {
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
a validation library with incredible TypeScript support that [T3 stack](https://create.t3.gg/) enjoyers talk about endlessly.

RHF supports validating forms with Zod via [resolvers](https://github.com/react-hook-form/resolvers#zod),
providing incredible typesafety in the process.

Using Zod will require installing `zod` and `@hookform/resolvers`,
then making a few changes to the above example:

```tsx
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const schema = z.object({
  email: z.string().email(),
  count: z.coerce.number()
});

const App = () => {
  const { register, handleSubmit } = useForm({
    resolver: zodResolver(schema)
  });

  return (
    <form onSubmit={handleSubmit((data) => {})}>
      <input
        type="email"
        required
        {...register('email')}
      />
      <input
        type="number"
        required
        {...register('count')}
      />
      <button type="submit">Submit</button>
    </form>
  )
}
```

Isn't it great!
`z.coerce.number()` provides a typesafe alternative to `valueAsNumber`,
and the keys of `z.object` define valid keys for `register()`.

> You could get rid of `required` from the inputs at this point,
but it's usually better to let the browser handle as much validation as possible.
Not to mention that a number input without `required` will provide a value of `'0'` instead of an empty string,
so no error will be produced by the browser or Zod.

There's a problem though:

**It's not actually typesafe.**

I know, I was surprised too.
Turns out resolvers can't set the generic parameter like we did with `FormTypes`,
so the `data` argument of `handleSubmit` is not properly typed.
Not to worry, we've got more work to do anyway.

## A Typesafe Coincidence

If you're anything like me you'll see `resolver: zodResolver(schema)` and cringe.
Apps can have many forms, meaning that line may be repeated a _lot_.
Sounds like a great use for a **custom hook!**

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

> Ok, it's not actually a coincidence.
It's because we're passing `TypeOf<Z>` directly to `UseFormProps`,
which is equivalent to doing `useForm<TypeOf<Z>>`.

Assuming `useZodForm` is imported,
here's how things should look now:

```tsx
const schema = z.object({
  email: z.string(),
  count: z.coerce.number()
});

export function App() {
  const { register, handleSubmit } = useZodForm({
    schema
  });

  return (
    <form onSubmit={handleSubmit((data /* has types now! */) => {})}>
      <input
        type="email"
        required
        {...register('email')}
      />
      <input
        type="number"
        required
        {...register('count')}
      />
      <button type="submit">Submit</button>
    </form>
  )
}

```

Here's a look at everything we've done so far:

<iframe
  src="https://stackblitz.com/edit/the-ultimate-form-abstraction-p1?embed=1&file=src/App.tsx&theme=dark&view=editor&ctl=1"
  class="w-full h-500px border-sm overflow-hidden"
  title="Stackblitz Demo for Part 1"
></iframe>

> Sidenote: 
I think demos like this are a good example of what TypeScript's developer experience should be -
generics behind the scenes propagating input types from inside RHF all the way out to our application code.
Libraries like [tRPC](https://trpc.io) and [TanStack Query/Router](https://tanstack.com/) manage to do a similar thing.

## When Things Go Wrong

So far we've been focused on handling successful submissions,
but what about when validation fails?

It would be nice to display error messages below the inputs,
and have those messages be sourced directly from RHF.
Luckily, we can access all data about the form via `formState`:

```tsx
const App = () => {
  const { register, handleSubmit, formState } = useZodForm(...);

  return (
    <form>
      <div>
        <input type="email" required {...register('email')} />
        {formState.errors.email && <p>{formState.errors.email.message}</p>}
      </div>
      <div>
        <input type="number" required {...register('count')} />
        {formState.errors.count && <p>{formState.errors.count.message}</p>}
      </div>
      <button type="submit">Submit</button>
    </form>
  );
}
```

It could work... but it's not pretty.

Seeing as pretty much all inputs will need this functionality,
maybe a component that contains both the input and error message would be nicer?
Sounds like a great idea, but where would `formState` come from?

Lucky for us, RHF provides utilities to make forms accessible from [context](https://beta.reactjs.org/learn/passing-data-deeply-with-context):

- [`FormProvider`](https://react-hook-form.com/api/formprovider) is an easy way to make a form accessible via context
- [`useFormContext`](https://react-hook-form.com/api/useformcontext) provides access to the form given to `FormProvider`

With them in mind,
let's take a look at our new input component: 

```tsx
import { ComponentProps, forwardRef } from 'react';
import { useFormContext } from 'react-hook-form';

interface Props extends ComponentProps<'input'> {
  name: string;
}

const Input = forwardRef<HTMLInputElement, Props>((props, ref) => {
  const form = useFormContext();
  const state = form.getFieldState(props.name);

  return (
    <div>
      <input {...props} ref={ref} />
      {state.error && <p>{state.error.message}</p>}
    </div>
  );
});

export default Input;
```

- The component's `Props` type is almost identical to a regular `<input/>` element's props,
except we make `name` required as it is needed to fetch the field's state.
The value for `name` is passed through by `register()`.

- [`forwardRef`](https://beta.reactjs.org/reference/react/forwardRef)
is used since `register()` assigns a ref on the `<input/>` element.

- All of the component's props are spread onto the `<input/>`,
and the ref provided by `forwardRef` is also passed through.

Great, now we have a component that can access field state via form context!
We're still missing the `FormProvider` though.

Seeing as all our forms will need to be wrapped in their own `FormProvider`,
this seems like a great time to create another component!

While we're at it, let's also wrap everything in a `<fieldset>`.
Not only is this good [Semantic HTML](https://developer.mozilla.org/en-US/docs/Glossary/Semantics),
but `<fieldset>` is unique in that it propagates its `disabled` attribute to form elements within it,
making styling for loading and disabled states much simpler!

```tsx
import { ComponentProps } from 'react';
import {
  FieldValues,
  FormProvider,
  SubmitHandler,
  UseFormReturn,
} from 'react-hook-form';

interface Props<T extends FieldValues>
  extends Omit<ComponentProps<'form'>, 'onSubmit'> {
  form: UseFormReturn<T>;
  onSubmit: SubmitHandler<T>;
}

const Form = <T extends FieldValues>({
  form,
  onSubmit,
  children,
  ...props
}: Props<T>) => (
  <FormProvider {...form}>
    <form onSubmit={form.handleSubmit(onSubmit)} {...props}>
      <fieldset disabled={form.formState.isSubmitting}>{children}</fieldset>
    </form>
  </FormProvider>
);

export default Form;
```

- The component takes the result of `useZodForm` in its `form` prop,
which is then spread onto `FormProvider`

- The type of the `onSubmit` prop is overridden to have correct types
(the `Omit<..., 'onSubmit'>` is necessary to please TypeScript)

- As before the `<form>` element's `onSubmit` is wrapped in `handleSubmit`,
only now that wrapper is coming from the `form` prop
instead of being defined earlier in the component

- `<fieldset>` has its `disabled` prop set to the form's `isSubmitting` state
so that all form inputs become disabled while the `onSubmit` function is running 

Continuing the trend of turning everything into a custom component,
why not make a `SubmitButton` component that we know will _always_ have `type="submit"`?

> This is more of a personal preference, feel free to not do this

```tsx
import { ComponentProps } from 'react';

interface Props extends Omit<ComponentProps<'button'>, 'type'> {}

const SubmitButton = (props: Props) => <button {...props} type="submit" />;

export default SubmitButton;
```

Now we can combine these new components to yield some much prettier code!

```tsx
const App = () => {
  const form = useZodForm(...);

  return (
    <Form form={form} onSubmit={(data /* has types! */) => {}}>
      <Input type="email" required {...form.register('email')} />
      <Input type="number" required {...form.register('count')} />
      <SubmitButton>Submit</SubmitButton>
    </Form>
  );
}
```

## Don't Forget the Labels!

Any good form author will realise that our forms currently have a big problem:

**Our form elements don't have corresponding `<label>` elements!**

Labels are good for multiple reasons:

1. Clicking them focuses their corresponding form element

2. [Semantic HTML](https://developer.mozilla.org/en-US/docs/Glossary/Semantics)

3. How is an end user supposed to know what each form element represents without labels?!

> "Ok, well how hard can adding some text above an element be?"

Harder than you may have thought -
`<label>` is special in that it has an `htmlFor` prop,
which is expected to be equal to its corresponding element's `id` prop,
so we're going to need a unique value identifying each form element...
Oh, we already have that with the `name` prop!

We're also going to need text to put inside of the `<label>`,
so let's just add a `label` prop to our `Input` component.

```tsx
interface Props extends ComponentProps<'input'> {
  name: string;
  label: string
}

const Input = forwardRef<HTMLInputElement, Props>((props, ref) => {
  const form = useFormContext();
  const state = form.getFieldState(props.name);

  return (
    <div>
      <label htmlFor={props.name}>{props.label}</label>
      <input {...props} id={props.name} ref={ref} />
      {state.error && <p>{state.error.message}</p>}
    </div>
  );
});
```

Lastly, we'll need to give each `Input` a label:

```tsx
<Form ... >
  <Input type="email" label="Email" required {...form.register('email')} />
  <Input type="number" label="Count" required {...form.register('count')} />
  <SubmitButton>Submit</SubmitButton>
</Form>
```

Now seems like the right time for another demo!

<iframe
  src="https://stackblitz.com/edit/the-ultimate-form-abstraction-p2?embed=1&file=src/App.tsx&theme=dark&view=editor&ctl=1"
  class="w-full h-500px border-sm overflow-hidden"
  title="Stackblitz Demo for Part 2"
></iframe>

## A Wider Selection of Form Elements

What we've got so far is great,
but it's a bit limited in terms of what elements our forms can contain.
Let's add a component that uses the `<select>` element!

```tsx
import { ComponentProps, forwardRef } from 'react';
import { useFormContext } from 'react-hook-form';

interface Props extends ComponentProps<'select'> {
  name: string;
  label: string
}

const Select = forwardRef<HTMLInputElement, Props>((props, ref) => {
  const form = useFormContext();
  const state = form.getFieldState(props.name);

  return (
    <div>
      <label htmlFor={props.name}>{props.label}</label>
      <select {...props} id={props.name} ref={ref} />
      {state.error && <p>{state.error.message}</p>}
    </div>
  );
});

export default Select;
```

Huh, that was easy... it's almost identical to our `Input` component,
but we can address the code duplication later.
Let's start using this new component!

Let's create a `Select` in our form with two options for `Apples` and `Oranges`:

> Using different values for the `value` and `children` of an `<option>`
is a fairly common practice, so I'm doing it here even though it's a bit redundant

```tsx
<Select label="Fruit" required {...form.register("fruit")}>
  <option value="apples">Apples</option>
  <option value="oranges">Oranges</option>
</Select>
```

Hmm... since we're adding a new field to the form,
we need to update the `schema` with a key for `fruit`
and a type for 'one of either `apples` or `oranges`'.

The former can be done easily, but the latter is a bit more Zod-specific.
I'll save you the trouble and show you what we need.

```tsx
const schema = z.object({
  email: z.string(),
  count: z.coerce.number()
  fruit: z.union(z.literal("apples"), z.literal("oranges"))
});
```

This will make sure `fruit` has a value equal to one of the string literals in the union,
giving the form's data a type something like this:

```tsx
{ 
  email: string,
  count: number,
  fruit: "apples" | "oranges"
}
```

Now we have a key and validation for our `fruit` field,
yet something still feels wrong...

```tsx
<option value="apples">Apples</option>
<option value="oranges">Oranges</option>
```

That's it, the `<option>` elements are **not typesafe at all!**

What we need is a way to turn our union for the `fruit` field into a list of `<option>` elements,
and at the same time display the correct value for `children`.

The first requirement can be addressed by diving further into Zod:

- `z.object()` has a `shape` property that is an object containing the schema of each field,
so `schema.shape.fruit` accesses the `z.union()` we created the `fruit` field with.

- `z.union()` has an `options` property that is an array containing each option that was provided,
so we can `.map()` on it to transform each `z.literal()` into a JSX element

- `z.literal()` has a `value` property containing the literal value that was provided

With this knowledge we can construct a JSX expression to `map()` over each `option`
and render a list of `<option>` elements:

```tsx
{schema.shape.option.options.map((op) => (
  <option key={op.value} value={op.value}>...</option>
))}
```

> `key` isn't really necessary for such a simple example,
but always including it is a good habit.

As for displaying the correct value for `children`,
we need the correct values to be stored somewhere so the `map()` function can get them.

A nice way to do this is with an object that maps each possible `value` to its corresponding `children`:

```tsx
const FruitMap = {
  apple: 'Apple',
  orange: 'Orange',
};
```

This would do the job, but **it's not typesafe enough!**

`FruitMap` should _only_ have keys that are specified inside the `fruit` field's `z.union()`.
Zod has `z.infer` for just this reason,
allowing the TypeScript type of the `z.union()` to be extracted from the schema
and used as an object's key type:

```tsx
const FruitMap: Record<z.infer<typeof schema>['fruit'], string> = {
  apple: 'Apple',
  orange: 'Orange',
};
```

Perfect! Now `FruitMap` is only allowed fields with keys that are also
valid values for `fruit`.

The last thing to do is to hook up `FruitMap` to our `<option>` list:

```tsx
{schema.shape.option.options.map((op) => (
  <option key={op.value} value={op.value}>
    {FruitMap[op.value]}
  </option>
))}
```

In context with the whole form:

```tsx
const schema = z.object({
  email: z.string(),
  count: z.coerce.number()
  fruit: z.union(z.literal("apples"), z.literal("oranges"))
});

const FruitMap: Record<z.infer<typeof schema>['fruit'], string> = {
  apple: 'Apple',
  orange: 'Orange',
};

const App = () => {
  const form = useZodForm(...);

  return (
    <Form ... >
      <Input ... />
      <Input ... />
      <Select label="Fruit" required {...form.register("fruit")}>
        {schema.shape.option.options.map((op) => (
          <option key={op.value} value={op.value}>
            {FruitMap[op.value]}
          </option>
        ))}
      </Select>
      <SubmitButton>Submit</SubmitButton>
    </Form>
  );
}
```

## Cleanup On Aisle Form

As we saw earlier, our `Input` and `Select`
components contain a lot of duplicate code. Yuck!

Let's try pulling out the wrapper `<div>`, `<label>`,
and error display into a separate component:

```tsx
import { PropsWithChildren } from 'react';

export interface Props extends PropsWithChildren {
    name: string,
    label: string
}

const FormField = ({ children, name, label }: Props) => {
  const ctx = useFormContext();
  const state = ctx.getFieldState(name);

  return (
    <div>
      <label htmlFor={name}>
        {label}
      </label>
      {children}
      {state.error && <p>{state.error.message}</p>}
    </div>
  );
};

export default FormField;
```

Not bad, let's see what our `Input` component looks like now:

```tsx
import FormField, { Props as FormFieldProps } from "./FormField"

interface Props extends FormFieldProps, ComponentProps<"input"> {
  name: string;
}

const Input = forwardRef<HTMLInputElement, Props>((props, ref) => (
  <FormField {...props}>
    <input {...props} id={props.name} ref={ref} />
  </FormField>
));
```

This is much nicer, but it still has a couple of problems:

1. I'm not too happy with passing _every_ prop of `Input` to `FormField`
(especially `children`!), it would be nice if the props could be split -
some for `FormField` and the rest for `<input>`

2. Surely we could remove `id={props.name}` and include it in the `{...props}` spread instead?

So, we need a function that splits our props into two sets of props:
one for `FormField`, and another for `<input>`.
The input type of this function will need to be part of `Props`,
and one of the two return values will need to be `FormFieldProps`.

Since this function will pick out specific props just for `FormField`,
let's call it `useFormField` and export some types accordingly!

```tsx
export interface UseFormFieldProps extends PropsWithChildren {
  name: string;
  label: string;
}

export const useFormField = <P extends UseFormFieldProps>(props: P) => {
  const { label, name, ...otherProps } = props;
  const id = name;

  return {
    formFieldProps: { id, name, label },
    childProps: { ...otherProps, id, name },
  };
};

interface Props extends UseFormFieldProps {
  id: string;
}

const FormField = ({ children, name, id, label }: Props) => {
  const ctx = useFormContext();
  const state = ctx.getFieldState(name);

  return (
    <div>
      <label htmlFor={id}>{label}</label>
      {children}
      {state.error && <p>{state.error.message}</p>}
    </div>
  );
};

export default FormField;
```

Including `id` in both sets of props makes for a more consistent `FormField`,
since `htmlFor` is designed to equal the `id` of its corresponding element.

It also allows us to remove `id={props.name}` from `<input>`:

```tsx
import FormField, { UseFormFieldProps, useFormField } from "./FormField"

interface Props extends UseFormFieldProps, ComponentProps<"input"> {
  name: string;
}

const Input = forwardRef<HTMLInputElement, Props>((props, ref) => {
  const { formFieldProps, childProps } = useFormField(props);

  return (
    <FormField {...formFieldProps}>
      <input {...childProps} ref={ref} />
    </FormField>
  );
});
```

Implementing this for `Select` is as easy as copying `Input` and changing a few words -
I'll let you do it yourself!

## Nobody Likes a Boring Form

All the work we've done has made our form pretty _in code_,
but to end users it looks terrible!
Time for some CSS.

I think there's a couple of options for adding CSS to our form elements:

1. Add `className` or inline styles directly to the components we've been building

2. Create separate components that are _only_ styled,
and consume those inside our form-enabled components

For your use case option 1 may be fine,
and it's simple enough that you can do it yourself.

I prefer option 2 though,
since it allows for UI components to be used without a form
(useful for buttons and basic inputs),
and opt-in support for form integration when necessary by just
swapping out for the form-enabled variants of each UI component.

Here's what that does to my file structure:

```
src/
  components/
    forms/
      Input.tsx
      Select.tsx
      Form.tsx
      FormField.tsx
      SubmitButton.tsx
    ui/
      Input.tsx
      Select.tsx
      Button.tsx
  App.tsx
```

Form-enabled components are just `FormField` wrappers around their
`components/ui` counterparts,
which in my case are styled with [Tailwind](https://tailwindcss.com/) or [UnoCSS](https://github.com/unocss/unocss),
but you could use elements from a component library like
[Mantine](https://mantine.dev/) or [MUI](https://mui.com/),
or even add styles to an unstyled component library like
[Headless UI](https://headlessui.com/) or [Radix UI](https://www.radix-ui.com/).

## Wrapping Things Up

This post has been long, but it only touches on a few of the many
features of [React Hook Form](https://react-hook-form.com/) and [Zod](https://zod.dev/).
I'd highly recommend reading their docs to learn how to fully utilise them.

Here's a final example demonstrating everything that has been discussed:
`Input`, `Select`, `FormField`, styling (via UnoCSS),
as well as some extra things like additional validations and a delay inside
`onSubmit` to demonstrate how `<fieldset>` propagates its `disabled` state.

<iframe
  src="https://stackblitz.com/edit/the-ultimate-form-abstraction?embed=1&file=src/App.tsx&theme=dark&view=editor&ctl=1"
  class="w-full h-500px border-sm overflow-hidden"
  title="Complete Stackblitz Demo"
></iframe>

Thanks for reading this post!
I've been holding onto this idea for ages
but only now decided to actually write about it.
I sincerely hope you enjoyed reading it or learned
something useful.

If you think this post could be valuable to others,
I'd really appreciate if you shared it on [Twitter](https://twitter.com)
and tag me [@brendonovichdev](https://twitter.com/brendonovichdev).

A big thank you goes out to these people for helping with this post:
- [Jordan Gensler](https://twitter.com/VapeJuiceJordan) (VapeJuiceJordan) for introducing me to this approach of creating forms
- [Shoubit Dash](https://www.nexxel.dev/) (Nexxel), [Finn Dore](https://github.com/finndore) and [Benjamin Akar](https://twitter.com/benjaminakar) (akawr) for proofreading
