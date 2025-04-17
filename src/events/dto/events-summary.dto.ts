import { ApiProperty } from "@nestjs/swagger";

export class SportCount {
  @ApiProperty()
  sport: string;

  @ApiProperty()
  count: number;
}

export class StatusCount {
  @ApiProperty()
  status: string;

  @ApiProperty()
  count: number;
}

export class EventsSummaryDto {
  @ApiProperty({ type: [SportCount] })
  sportCounts: SportCount[];

  @ApiProperty({ type: [StatusCount] })
  statusCounts: StatusCount[];

  @ApiProperty()
  totalEvents: number;
}
