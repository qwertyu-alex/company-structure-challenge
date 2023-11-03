import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link2, Plus } from "lucide-react";
import { memo } from "react";
import { useForm } from "react-hook-form";
import { Handle, NodeProps, Position } from "reactflow";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/trpc/react";

export type NodeData = {
  parentId?: string;
  name: string;
  height: number;
  managingDepartment?: string;
  preferredProgrammingLanguage?: string;
};

export type FormNodeData = {
  parentId: string | null;
};

const developerIcon = "💻";
const managerIcon = "📊";

const NodeRaw = (props: NodeProps<NodeData>) => {
  const data = props.data;

  console.log(data.preferredProgrammingLanguage);

  return (
    <div
      className={cn(
        "rounded-md border-2 bg-background px-4 py-2 shadow-md",
        props.selected ? "border-stone-600" : "border-stone-400",
      )}
    >
      <div className="flex py-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          {data.managingDepartment && managerIcon}
          {data.preferredProgrammingLanguage && developerIcon}
        </div>
        <div className="ml-2 flex w-48 flex-col gap-2 ">
          <div className="rounded border p-2 text-lg font-bold">
            {data.name}
          </div>
          <div className="rounded border p-2 text-muted-foreground">
            Height: {data.height}
          </div>
          {data.managingDepartment && (
            <div className="rounded border p-2 text-muted-foreground">
              <p>Managing department:</p>
              <p> {data.managingDepartment}</p>
            </div>
          )}
          {data.preferredProgrammingLanguage && (
            <div className="rounded border p-2 text-muted-foreground">
              Preferred language: {data.preferredProgrammingLanguage}
            </div>
          )}
        </div>
      </div>

      <Handle
        type="target"
        position={Position.Top}
        className="flex h-5 w-16 flex-col items-center rounded"
      >
        <Link2
          className="pointer-events-none m-auto text-background"
          size={10}
          type="target"
        />
      </Handle>

      <Handle
        type="source"
        position={Position.Bottom}
        className="flex-com flex h-5 w-16 items-center rounded"
      >
        <Plus
          className="pointer-events-none m-auto text-background"
          size={10}
          type="target"
        />
      </Handle>
    </div>
  );
};

const FormNodeRaw = (props: NodeProps<NodeData>) => {
  const utils = api.useUtils();

  const { isLoading, ...mutation } = api.node.create.useMutation();

  const formSchema = z.object({
    name: z.string().min(1),
  });
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    console.log(values, props.data);
    mutation
      .mutateAsync({ name: values.name, parentId: props.data.parentId })
      .then((data) => {
        utils.node.get.invalidate();
      });
  };

  return (
    <div
      className={cn(
        "rounded-md border-2  bg-background px-4 py-3 shadow-md ",
        props.selected ? "border-stone-600" : "border-stone-400",
      )}
    >
      <div className="flex">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <fieldset disabled={isLoading} className="space-y-5">
              <h3 className="text-xl font-bold">Add a new employee</h3>
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Peter" {...field} />
                    </FormControl>
                    <FormDescription>
                      What is the name of the employee?
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit">Submit</Button>
            </fieldset>
          </form>
        </Form>
      </div>

      <Handle
        type="target"
        position={Position.Top}
        className="invisible w-16 rounded"
        isConnectableStart={false}
        isConnectableEnd={false}
      ></Handle>
    </div>
  );
};

const SkeletonNodeRaw = () => (
  <Skeleton className="h-[300px] w-[300px]"></Skeleton>
);

export const StandardNode = memo(NodeRaw);
export const FormNode = memo(FormNodeRaw);
export const SkeletonNode = memo(SkeletonNodeRaw);
