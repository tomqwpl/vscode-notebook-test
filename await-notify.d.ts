declare module 'await-notify' {
    export class Subject {
        notify() : void;
        notifyAll() : void;
        wait() : Promise<void>;
    }
}