captain.call allows you to easily create or override CLI commands/applications.

captain.call was born from the abstraction of the functionality within gowait, a node tool that allows users to sequence and consolidate the output of multiple commands.

captain.call works by intercepting commands and calling them against registered handlers. By default captain.call calls commands with the default command handler if no matching handlers are registered. This simply spawns and returns the command as a child process, simulating standard CLI functionality. This default behaviour can be overridden.