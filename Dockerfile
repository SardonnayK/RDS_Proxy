FROM public.ecr.aws/lambda/dotnet:6

WORKDIR /var/task
COPY "app/publish"  ./
CMD [ "src" ]