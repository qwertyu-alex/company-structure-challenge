"use client";

import { Check, ChevronsUpDown } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { atomContextNodeID } from "@/lib/atoms";
import { cn } from "@/lib/utils";
import { api } from "@/trpc/react";
import { useAtom } from "jotai";

export const Search = () => {
  const [open, setOpen] = React.useState(false);
  const [contextNode, setContextNode] = useAtom(atomContextNodeID);

  const { data } = api.node.get.useQuery({});

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <div className="flex gap-2">
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-80 justify-between bg-opacity-40 shadow-xl"
          >
            {contextNode
              ? data?.find((framework) => framework.id === contextNode)?.name
              : "Search for node"}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <Button
          variant="outline"
          className="shadow-xl"
          onClick={() => {
            setContextNode(null);
          }}
        >
          Clear
        </Button>
      </div>
      <PopoverContent className="w-80 p-0">
        <Command>
          <CommandInput placeholder="Search for a node..." />
          <CommandEmpty>No framework found.</CommandEmpty>
          <CommandGroup>
            {data?.map((framework) => (
              <CommandItem
                key={framework.id}
                value={framework.name}
                onSelect={(currentValue) => {
                  setContextNode(
                    currentValue === contextNode ? null : currentValue,
                  );
                  setOpen(false);
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    contextNode === framework.id ? "opacity-100" : "opacity-0",
                  )}
                />
                {framework.name}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
