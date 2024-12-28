import { type VariantProps } from 'class-variance-authority';
export { default as Button } from './Button.vue';
export declare const buttonVariants: (props?: ({
    variant?: "default" | "link" | "outline" | "secondary" | "destructive" | "ghost" | null | undefined;
    size?: "default" | "icon" | "xs" | "sm" | "lg" | null | undefined;
} & import("class-variance-authority/dist/types").ClassProp) | undefined) => string;
export type ButtonVariants = VariantProps<typeof buttonVariants>;
