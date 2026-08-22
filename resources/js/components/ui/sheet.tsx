import * as SheetPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import * as React from 'react';
import { cn } from '@/lib/utils';

const Sheet = SheetPrimitive.Root;
const SheetTrigger = SheetPrimitive.Trigger;
const SheetClose = SheetPrimitive.Close;
const SheetPortal = SheetPrimitive.Portal;

const SheetOverlay = React.forwardRef<
    React.ComponentRef<typeof SheetPrimitive.Overlay>,
    React.ComponentPropsWithoutRef<typeof SheetPrimitive.Overlay>
>(({ className, ...props }, ref) => (
    <SheetPrimitive.Overlay
        className={cn('fixed inset-0 z-50 bg-black/50', className)}
        {...props}
        ref={ref}
    />
));
SheetOverlay.displayName = SheetPrimitive.Overlay.displayName;

const SheetContent = React.forwardRef<
    React.ComponentRef<typeof SheetPrimitive.Content>,
    React.ComponentPropsWithoutRef<typeof SheetPrimitive.Content> & {
        side?: 'left' | 'right' | 'bottom';
    }
>(({ side = 'left', className, children, ...props }, ref) => (
    <SheetPortal>
        <SheetOverlay />
        <SheetPrimitive.Content
            ref={ref}
            className={cn(
                'fixed z-50 flex flex-col gap-4 p-6 shadow-lg',
                side === 'bottom'
                    ? 'inset-x-0 bottom-0 max-h-[80vh] rounded-t-3xl bg-background pb-safe text-foreground'
                    : 'inset-y-0 h-full w-72 bg-sidebar text-sidebar-foreground',
                side === 'left' && 'left-0',
                side === 'right' && 'right-0',
                className,
            )}
            {...props}
        >
            {children}
            <SheetPrimitive.Close className="absolute top-4 right-4 rounded-sm opacity-70 hover:opacity-100">
                <X className="size-4" />
                <span className="sr-only">Close</span>
            </SheetPrimitive.Close>
        </SheetPrimitive.Content>
    </SheetPortal>
));
SheetContent.displayName = SheetPrimitive.Content.displayName;

const SheetHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div className={cn('flex flex-col gap-2 text-left', className)} {...props} />
);

const SheetTitle = React.forwardRef<
    React.ComponentRef<typeof SheetPrimitive.Title>,
    React.ComponentPropsWithoutRef<typeof SheetPrimitive.Title>
>(({ className, ...props }, ref) => (
    <SheetPrimitive.Title ref={ref} className={cn('text-lg font-semibold', className)} {...props} />
));
SheetTitle.displayName = SheetPrimitive.Title.displayName;

export { Sheet, SheetTrigger, SheetClose, SheetContent, SheetHeader, SheetTitle };
