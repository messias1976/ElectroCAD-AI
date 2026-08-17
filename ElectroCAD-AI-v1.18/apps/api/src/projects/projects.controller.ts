import {
  Body, Controller, Delete, Get, Param, Post, Put, Req, UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@Controller('projects')
@UseGuards(AuthGuard('jwt'))
export class ProjectsController {
  constructor(private projectsService: ProjectsService) {}

  @Post()
  create(@Req() req: any, @Body() dto: CreateProjectDto) {
    return this.projectsService.create(req.user.userId, req.user.role, dto);
  }

  @Get()
  findAll(@Req() req: any) {
    return this.projectsService.findAll(req.user.userId, req.user.role);
  }

  @Get(':id')
  findOne(@Req() req: any, @Param('id') id: string) {
    return this.projectsService.findById(req.user.userId, req.user.role, id);
  }

  @Put(':id')
  update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateProjectDto) {
    return this.projectsService.update(req.user.userId, req.user.role, id, dto);
  }

  @Delete(':id')
  remove(@Req() req: any, @Param('id') id: string) {
    return this.projectsService.remove(req.user.userId, req.user.role, id);
  }
}
